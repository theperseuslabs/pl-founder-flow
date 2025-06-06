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

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get the user ID from the cookie
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the user ID in the database
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE marketing_automations SET userid = $1 WHERE id = $2',
        [userId, id]
      );

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user ID:', error);
    return NextResponse.json(
      { error: 'Failed to update user ID' },
      { status: 500 }
    );
  }
} 