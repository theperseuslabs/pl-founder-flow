import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';

const pool = new Pool({
  user: 'postgres',
  host: 'coolify.kothariatit.com',
  database: 'postgres',
  password: 'nGVKnt89uHTZYsBw8iSMK0eAkyWC1PyNY34uwhe5gMifMOnk0clnRo8HiSZ2O3vc',
  port: 5432,
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, dm_num, dm_frequency } = body;

    if (!project_id || !dm_num || !dm_frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // First check if the project belongs to the user
      const checkResult = await client.query(
        'SELECT id FROM marketing_automations WHERE id = $1 AND userid = $2',
        [project_id, userId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Check if a scheduler config already exists for this project
      const existingConfig = await client.query(
        'SELECT id FROM ema_scheduler WHERE project_id = $1',
        [project_id]
      );

      let result;
      if (existingConfig.rows.length > 0) {
        // Update existing config
        result = await client.query(
          `UPDATE ema_scheduler 
           SET dm_num = $1, 
               dm_frequency = $2
           WHERE project_id = $3
           RETURNING *`,
          [dm_num, dm_frequency, project_id]
        );
      } else {
        // Insert new config
        result = await client.query(
          `INSERT INTO ema_scheduler 
           (userid, project_id, dm_num, dm_frequency)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [userId, project_id, dm_num, dm_frequency]
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving scheduler config:', error);
    return NextResponse.json(
      { error: 'Failed to save scheduler config' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM ema_scheduler WHERE project_id = $1 AND userid = $2',
        [projectId, userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(null);
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching scheduler config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduler config' },
      { status: 500 }
    );
  }
} 