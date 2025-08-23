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

      // Get query parameters to determine what type of history to fetch
      const { searchParams } = new URL(request.url);
      const interactionType = searchParams.get('type');

      let result;
      
      if (interactionType === 'reddit_post') {
        // Fetch Reddit post interactions using helper function
        const redditResult = await fetchRedditPostInteractions(params.id, client);
        if (!redditResult.success) {
          return NextResponse.json({ error: redditResult.error }, { status: 500 });
        }
        
        // Also fetch statistics for Reddit posts
        const statsResult = await getRedditPostStats(params.id, client);
        
        result = { rows: redditResult.data };
        
        return NextResponse.json({ 
          history: redditResult.data,
          type: 'reddit_post',
          total_count: redditResult.count,
          stats: statsResult.success ? statsResult.stats : null
        });
      } else {
        // Default: fetch email send history (existing functionality)
        result = await client.query(
          `SELECT "to", status, created_date FROM ema_interaction_details 
           WHERE project_id = $1 
             AND interaction_type = 'reddit_dm'
             AND "to" IS NOT NULL 
             AND status IS NOT NULL 
             AND created_date IS NOT NULL 
           ORDER BY created_date DESC `,
          [params.id]
        );
      }

      return NextResponse.json({ 
        history: result.rows,
        type: interactionType || 'email',
        total_count: result.rows.length
      });
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

/**
 * Helper function to fetch Reddit post interactions for a specific project
 * @param projectId - The project ID to fetch interactions for
 * @param client - PostgreSQL client connection
 * @returns Promise with Reddit post interaction data
 */
async function fetchRedditPostInteractions(projectId: string, client: any) {
  try {
    const result = await client.query(
      `SELECT 
        id,
        project_id,
        interaction_type,
        "from",
        "to",
        created_date,
        subject,
        message,
        url,
        CASE 
          WHEN status = 'success' THEN 'Posted Successfully'
          WHEN status = 'pending' THEN 'Pending'
          WHEN status = 'failed' THEN 'Failed'
          WHEN status = 'processing' THEN 'Processing'
          ELSE status
        END as status_display
       FROM ema_interaction_details 
       WHERE project_id = $1 
         AND interaction_type = 'reddit_post'
       ORDER BY created_date DESC`,
      [projectId]
    );
    
    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    };
  } catch (error) {
    console.error('Error fetching Reddit post interactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Reddit post interactions',
      data: []
    };
  }
}

/**
 * Helper function to get Reddit post interaction statistics
 * @param projectId - The project ID to get stats for
 * @param client - PostgreSQL client connection
 * @returns Promise with statistics data
 */
async function getRedditPostStats(projectId: string, client: any) {
  try {
    const result = await client.query(
      `SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_posts,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_posts,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_posts,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_posts,
        MAX(created_date) as last_post_date
       FROM ema_interaction 
       WHERE project_id = $1 
         AND interaction_type = 'reddit_post'`,
      [projectId]
    );
    
    return {
      success: true,
      stats: result.rows[0]
    };
  } catch (error) {
    console.error('Error fetching Reddit post stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Reddit post stats',
      stats: null
    };
  }
} 