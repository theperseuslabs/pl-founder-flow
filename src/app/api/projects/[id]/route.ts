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
    const { productname, url, elevatorpitch, purpose, response } = body;

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
             response = $5
         WHERE id = $6 AND userid = $7
         RETURNING *`,
        [productname, url, elevatorpitch, purpose, response, params.id, userId]
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