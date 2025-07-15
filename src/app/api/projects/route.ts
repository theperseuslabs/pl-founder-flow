import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'coolify.kothariatit.com',
  database: 'postgres',
  password: 'nGVKnt89uHTZYsBw8iSMK0eAkyWC1PyNY34uwhe5gMifMOnk0clnRo8HiSZ2O3vc',
  port: 5432,
});

export async function GET(request: Request) {
  try {
    // Get the user ID from the cookie
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('userId', userId);
    // Query the marketing_automations table for the user's projects
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM marketing_automations WHERE userid = $1',
        [userId]
      );

      return NextResponse.json({ projects: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { productname, url, elevatorpitch, purpose, subject, message_copy } = body;
    if (!productname || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO marketing_automations (userid, productname, url, elevatorpitch, purpose, subject, message_copy, reddit_connected)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false)
         RETURNING *`,
        [userId, productname, url, elevatorpitch, purpose, subject, message_copy]
      );
      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 