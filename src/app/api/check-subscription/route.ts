import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51RUEZa4Eyt5i6lfnyX0YJGJtcc4foxXUFZg4dFkqUAVw4Jcl0SAMzUCEbPEGl7O9iEOv7vtZfdKuNb3xs9utzZT600u0hbKfoe', {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: Request) {
  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // Find the customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ isSubscribed: false });
    }

    const customer = customers.data[0];

    // Get all subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    const isSubscribed = subscriptions.data.length > 0;

    return NextResponse.json({ isSubscribed });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
} 