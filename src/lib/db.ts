import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'coolify.kothariatit.com',
  database: 'postgres',
  password: 'nGVKnt89uHTZYsBw8iSMK0eAkyWC1PyNY34uwhe5gMifMOnk0clnRo8HiSZ2O3vc',
  port: 5432,
});

interface RedditAuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Fetches Reddit access and refresh tokens for a given user.
 * Assumes a table named 'reddit_auth_info' with columns 'user_id',
 * 'reddit_access_token', and 'reddit_refresh_token'.
 */
export const getRedditAuthTokens = async (userId: string): Promise<RedditAuthTokens> => {
  const query = `
    SELECT reddit_access_token, reddit_refresh_token
    FROM reddit_auth_info
    WHERE user_id = $1;
  `;
  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length > 0) {
      return {
        accessToken: result.rows[0].reddit_access_token,
        refreshToken: result.rows[0].reddit_refresh_token,
      };
    }
    return { accessToken: null, refreshToken: null };
  } catch (error) {
    console.error('Error fetching Reddit auth tokens:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

/**
 * Updates the Reddit access token (and optionally refresh token) for a given user.
 * Assumes a table named 'reddit_auth_info' with columns 'user_id',
 * 'reddit_access_token', and 'reddit_refresh_token'.
 */
export const updateRedditTokens = async (
  userId: string,
  newAccessToken: string,
  newRefreshToken?: string
): Promise<void> => {
  let query;
  let params: any[];

  if (newRefreshToken) {
    query = `
      UPDATE reddit_auth_info
      SET reddit_access_token = $1, reddit_refresh_token = $2
      WHERE user_id = $3;
    `;
    params = [newAccessToken, newRefreshToken, userId];
  } else {
    query = `
      UPDATE reddit_auth_info
      SET reddit_access_token = $1
      WHERE user_id = $2;
    `;
    params = [newAccessToken, userId];
  }

  try {
    await pool.query(query, params);
  } catch (error) {
    console.error('Error updating Reddit access token:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// It might be useful to have a function to initially store the tokens as well.
// This can be added if there's a flow for initial authorization.
/**
 * Stores initial Reddit access and refresh tokens for a given user.
 * This function would typically be used after the initial OAuth authorization.
 */
export const storeRedditAuthTokens = async (
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number // Duration in seconds for when the access token expires
): Promise<void> => {
  // Calculate expiry timestamp
  const expiryTimestamp = new Date(Date.now() + expiresIn * 1000);
  const query = `
    INSERT INTO reddit_auth_info (user_id, reddit_access_token, reddit_refresh_token, reddit_token_expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE
    SET reddit_access_token = EXCLUDED.reddit_access_token,
        reddit_refresh_token = EXCLUDED.reddit_refresh_token,
        reddit_token_expires_at = EXCLUDED.reddit_token_expires_at;
  `;
  try {
    await pool.query(query, [userId, accessToken, refreshToken, expiryTimestamp]);
  } catch (error) {
    console.error('Error storing Reddit auth tokens:', error);
    throw error;
  }
};

// Modified getRedditAuthTokens to also fetch expiry time for access token
interface RedditAuthInfo extends RedditAuthTokens {
  expiresAt: Date | null;
}

export const getRedditAuthInfo = async (userId: string): Promise<RedditAuthInfo> => {
  const query = `
    SELECT reddit_access_token, reddit_refresh_token, reddit_token_expires_at
    FROM reddit_auth_info
    WHERE user_id = $1;
  `;
  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length > 0) {
      return {
        accessToken: result.rows[0].reddit_access_token,
        refreshToken: result.rows[0].reddit_refresh_token,
        expiresAt: result.rows[0].reddit_token_expires_at ? new Date(result.rows[0].reddit_token_expires_at) : null,
      };
    }
    return { accessToken: null, refreshToken: null, expiresAt: null };
  } catch (error) {
    console.error('Error fetching Reddit auth info:', error);
    throw error;
  }
};

// Update function to also handle expiry time
export const updateRedditAccessToken = async (
  userId: string,
  newAccessToken: string,
  expiresIn: number, // Reddit typically provides 'expires_in' in seconds
  newRefreshToken?: string
): Promise<void> => {
  const expiryTimestamp = new Date(Date.now() + expiresIn * 1000);
  let query;
  let params: any[];

  if (newRefreshToken) {
    query = `
      UPDATE reddit_auth_info
      SET reddit_access_token = $1, reddit_refresh_token = $2, reddit_token_expires_at = $3
      WHERE user_id = $4;
    `;
    params = [newAccessToken, newRefreshToken, expiryTimestamp, userId];
  } else {
    query = `
      UPDATE reddit_auth_info
      SET reddit_access_token = $1, reddit_token_expires_at = $2
      WHERE user_id = $3;
    `;
    params = [newAccessToken, expiryTimestamp, userId];
  }

  try {
    await pool.query(query, params);
  } catch (error) {
    console.error('Error updating Reddit access token:', error);
    throw error;
  }
};
