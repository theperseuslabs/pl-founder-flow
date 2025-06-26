import { getRedditAuthInfo, updateRedditAccessToken, storeRedditAuthTokens } from './db';

const REDDIT_API_BASE_URL = 'https://oauth.reddit.com';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

// These should ideally be stored in environment variables and not hardcoded
// For the purpose of this exercise, I'm assuming they might be passed or configured elsewhere.
// If you have a specific way to access them (e.g., process.env.REDDIT_CLIENT_ID), let me know.
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID; // Replace with your actual client ID
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET; // Replace with your actual client secret

interface RedditTokenResponse {
  access_token: string;
  token_type: string; // Should be "bearer"
  expires_in: number; // Duration in seconds
  refresh_token?: string; // Sometimes a new refresh token is issued
  scope: string;
}

/**
 * Refreshes the Reddit access token using the refresh token.
 */
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit client ID or secret is not configured.');
  }

  const basicAuth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to refresh token and parse error response' }));
    console.error('Reddit token refresh failed:', response.status, errorData);
    // If refresh fails (e.g. invalid refresh token), specific error handling might be needed,
    // like prompting the user to re-authenticate.
    throw new Error(`Reddit token refresh failed: ${response.status} ${errorData.error || ''}`);
  }

  const tokenData = await response.json() as RedditTokenResponse;

  await updateRedditAccessToken(
    userId,
    tokenData.access_token,
    tokenData.expires_in,
    tokenData.refresh_token // Update if a new refresh token is provided
  );

  return tokenData.access_token;
}

/**
 * Gets a valid Reddit access token for the user.
 * If the current token is expired or missing, it attempts to refresh it.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const authInfo = await getRedditAuthInfo(userId);

  if (!authInfo.refreshToken) {
    // This case implies the user has never authenticated or their refresh token was lost.
    // They would need to go through the full OAuth flow again.
    throw new Error('No refresh token available. User needs to re-authenticate with Reddit.');
  }

  if (authInfo.accessToken && authInfo.expiresAt) {
    // Check if token is still valid (e.g., with a 60-second buffer)
    const bufferSeconds = 60;
    if (authInfo.expiresAt.getTime() > Date.now() + bufferSeconds * 1000) {
      return authInfo.accessToken;
    }
  }

  // Access token is missing, expired, or about to expire, so refresh it
  return refreshAccessToken(userId, authInfo.refreshToken);
}

/**
 * Sends a private message on Reddit.
 * @param userId - The ID of the user in your system, used to fetch their Reddit tokens.
 * @param to - The username of the recipient.
 * @param subject - The subject of the message.
 * @param text - The body of the message (markdown).
 */
export async function sendRedditMessage(
  userId: string,
  to: string,
  subject: string,
  text: string
): Promise<any> {
  const accessToken = await getValidAccessToken(userId);

  const response = await fetch(`${REDDIT_API_BASE_URL}/api/compose`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'YourApp/1.0 by YourUsername' // Replace with your app's user agent
    },
    body: new URLSearchParams({
      to: to,
      subject: subject,
      text: text,
      api_type: 'json', // Ensures response is JSON
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to send message and parse error response' }));
    console.error('Reddit send message failed:', response.status, errorData);
    throw new Error(`Reddit send message failed: ${response.status} - ${errorData.message || errorData?.json?.errors?.join(', ')}`);
  }

  const responseData = await response.json();

  // The Reddit API often wraps successful responses in a 'json' object with a 'data' or 'errors' field.
  // For /api/compose, a successful response might look like: { json: { errors: [] } }
  // or { json: { data: { ... } } }
  if (responseData.json && responseData.json.errors && responseData.json.errors.length > 0) {
    console.error('Reddit API returned errors for send message:', responseData.json.errors);
    throw new Error(`Reddit API error: ${responseData.json.errors.map((e: any[]) => e[0]).join(', ')}`);
  }

  return responseData;
}

// Example of how initial token storage might be called after OAuth flow.
// This is not directly used by sendMessage but shows how tokens get into the DB.
// You would call this from your OAuth callback handler.
export async function handleRedditOAuthCallback(
  userId: string,
  authorizationCode: string,
  redirectUri: string
): Promise<void> {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit client ID or secret is not configured.');
  }

  const basicAuth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUri, // Must match the redirect_uri used in the authorization request
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to exchange code for token' }));
    console.error('Reddit token exchange failed:', response.status, errorData);
    throw new Error(`Reddit token exchange failed: ${response.status} ${errorData.error || ''}`);
  }

  const tokenData = await response.json() as RedditTokenResponse;

  if (!tokenData.refresh_token) {
    // Some OAuth flows (e.g. "temporary" for script type apps) might not return a refresh token.
    // Ensure your app requests 'permanent' access if you need a refresh token.
    console.warn('No refresh token received from Reddit. User may need to re-authenticate frequently.');
  }

  await storeRedditAuthTokens(
    userId,
    tokenData.access_token,
    tokenData.refresh_token || '', // Store empty string if no refresh token
    tokenData.expires_in
  );
}
