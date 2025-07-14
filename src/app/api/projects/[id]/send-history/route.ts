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
      // Only fetch send history for projects owned by the user
      const projectResult = await client.query(
        'SELECT id FROM marketing_automations WHERE id = $1 AND userid = $2',
        [params.id, userId]
      );
      if (projectResult.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const result = await client.query(
        `SELECT "to", status, created_date FROM ema_interaction_details 
         WHERE project_id = $1 
           AND "to" IS NOT NULL 
           AND status IS NOT NULL 
           AND created_date IS NOT NULL 
         ORDER BY created_date DESC `,
        [params.id]
      );
      return NextResponse.json({ history: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching send history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch send history' },
      { status: 500 }
    );
  }
} 