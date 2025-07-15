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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM marketing_automations WHERE id = $1 AND userid = $2',
        [params.id, userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productname, url, elevatorpitch, purpose, subject, message_copy } = body;

    const client = await pool.connect();
    try {
      // First check if the project belongs to the user
      const checkResult = await client.query(
        'SELECT id FROM marketing_automations WHERE id = $1 AND userid = $2',
        [params.id, userId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Update the project
      const result = await client.query(
        `UPDATE marketing_automations 
         SET productname = $1, 
             url = $2, 
             elevatorpitch = $3, 
             purpose = $4, 
             subject = $5,
             message_copy = $6
         WHERE id = $7 AND userid = $8
         RETURNING *`,
        [productname, url, elevatorpitch, purpose, subject, message_copy, params.id, userId]
      );

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      // First check if the project belongs to the user
      const checkResult = await client.query(
        'SELECT id FROM marketing_automations WHERE id = $1 AND userid = $2',
        [params.id, userId]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Delete from reddit_auth_info first (if exists)
      await client.query(
        'DELETE FROM reddit_auth_info WHERE project_id = $1',
        [params.id]
      );
      // Delete from ema_scheduler (if exists)
      await client.query(
        'DELETE FROM ema_scheduler WHERE project_id = $1',
        [params.id]
      );
      // Delete the project
      await client.query(
        'DELETE FROM marketing_automations WHERE id = $1 AND userid = $2',
        [params.id, userId]
      );
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 