import { NextRequest, NextResponse } from 'next/server';
import { sendRedditMessage } from '../../../../lib/redditService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, to, subject, text } = body;

    if (!userId || !to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, to, subject, or text' },
        { status: 400 }
      );
    }

    // Potentially, you might want to validate the userId here,
    // e.g., by checking if it matches an authenticated user session if your app has user logins.
    // For now, we'll assume userId is valid and corresponds to an entry in your reddit_auth_info table.

    const result = await sendRedditMessage(userId, to, subject, text);

    // The sendRedditMessage function will throw an error if the API call fails or returns an error.
    // If it completes without throwing, we can assume success.
    // The 'result' variable contains the full response from Reddit, which might be useful to log or return.
    return NextResponse.json(
      { success: true, message: 'Reddit message sent successfully.', data: result },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in /api/reddit/send-message:', error);

    // Provide a more user-friendly error message
    let errorMessage = 'Failed to send Reddit message.';
    if (error.message) {
      errorMessage = error.message;
    }

    // Determine appropriate status code, default to 500 if not more specific
    let statusCode = 500;
    if (error.message.includes('No refresh token available') || error.message.includes('Reddit token refresh failed')) {
      // These errors might indicate a need for re-authentication or configuration issues
      statusCode = 401; // Unauthorized or authentication failure
    } else if (error.message.includes('Reddit send message failed')) {
      // Errors specifically from the send message call might be due to bad input or API issues
      statusCode = 400; // Bad Request or specific Reddit error
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
