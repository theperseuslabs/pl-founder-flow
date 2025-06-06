import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/config';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

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
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Get the project ID from cookie
    const cookieStore = cookies();
    const projectId = cookieStore.get('project_id')?.value;
    const userId = cookieStore.get('user_id')?.value;

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID or User ID not found' }, { status: 400 });
    }
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }
    
    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
    
    const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
    const authHeader = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code as string);
    params.append('redirect_uri', redirectUri as string);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `web:com.example.redditmessageconduit:v0.1.0 (by /u/VacationExpensive219)`
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return NextResponse.json({ error }, { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();

    // Get Reddit username using the access token
    const redditUserResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!redditUserResponse.ok) {
      return NextResponse.json({ error: 'Failed to get Reddit user info' }, { status: 500 });
    }

    const redditUserData = await redditUserResponse.json();

    // Save Reddit auth info to PostgreSQL
    const client = await pool.connect();
    try {
      // First, check if there's an existing auth record for this project
      const existingAuth = await client.query(
        'SELECT id FROM reddit_auth_info WHERE project_id = $1',
        [projectId]
      );

      if (existingAuth.rows.length > 0) {
        // Update existing record
        await client.query(
          `UPDATE reddit_auth_info 
           SET reddit_username = $1, 
               client_secret = $2, 
               code = $3
           WHERE project_id = $4`,
          [
            redditUserData.name,
            tokenData.refresh_token,
            code,
            projectId
          ]
        );
      } else {
        // Insert new record with a smaller timestamp-based ID
        const timestampId = Math.floor(Date.now() / 1000); // Convert to seconds instead of milliseconds
        await client.query(
          `INSERT INTO reddit_auth_info 
           (id, project_id, reddit_username, client_secret, code, userid)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            timestampId,
            projectId,
            redditUserData.name,
            tokenData.refresh_token,
            code,
            userId
          ]
        );
      }

      // Update the project's reddit_connected status
      await client.query(
        'UPDATE marketing_automations SET reddit_connected = true WHERE id = $1',
        [projectId]
      );

    } finally {
      client.release();
    }

    // Clear the project_id cookie
    cookieStore.delete('project_id');

    // Redirect to dashboard with success message
    return NextResponse.redirect(new URL('/dashboard?reddit_connected=true', request.url));
  } catch (error) {
    console.error('Reddit OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Failed to process Reddit OAuth callback' },
      { status: 500 }
    );
  }
} 