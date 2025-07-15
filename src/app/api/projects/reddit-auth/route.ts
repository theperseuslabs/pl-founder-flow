import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'coolify.kothariatit.com',
  database: 'postgres',
  password: 'nGVKnt89uHTZYsBw8iSMK0eAkyWC1PyNY34uwhe5gMifMOnk0clnRo8HiSZ2O3vc',
  port: 5432,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT reddit_username FROM reddit_auth_info WHERE project_id = $1',
        [projectId]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ reddit_username: null }, { status: 200 });
      }
      return NextResponse.json({ reddit_username: result.rows[0].reddit_username });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching reddit username:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reddit username' },
      { status: 500 }
    );
  }
} 