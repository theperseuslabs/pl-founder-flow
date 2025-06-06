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
    
    // Verify state parameter to prevent CSRF
    // const cookieStore = cookies();
    // const storedState = cookieStore.get('reddit_oauth_state')?.value;
    // if (!state || state !== storedState) {
    //   return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    // }
    
    // Clear the state cookie after verification
    // cookieStore.delete('reddit_oauth_state');
    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }
    
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
        'User-Agent': `web:com.example.redditmessageconduit:v0.1.0 (by /u/VacationExpensive219)` // Replace
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

    // const redditUserData = await redditUserResponse.json();

    // // Get project_id from marketing_automations table
    // const client = await pool.connect();
    // try {
    //   const projectResult = await client.query(
    //     'SELECT id FROM marketing_automations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    //     [currentUser.uid]
    //   );

    //   if (projectResult.rows.length === 0) {
    //     return NextResponse.json({ error: 'No marketing automation project found' }, { status: 404 });
    //   }

    //   const projectId = projectResult.rows[0].id;

    //   // Save Reddit auth info to PostgreSQL
    //   await client.query(
    //     `INSERT INTO reddit_auth_info (id, project_id, reddit_username, client_secret, code)
    //      VALUES ($1, $2, $3, $4, $5)`,
    //     [
    //       Date.now(), // Using timestamp as ID
    //       projectId,
    //       redditUserData.name,
    //       tokenData.refresh_token,
    //       code
    //     ]
    //   );
    // } finally {
    //   client.release();
    // }

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