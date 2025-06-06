import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51RUEZa4Eyt5i6lfnyX0YJGJtcc4foxXUFZg4dFkqUAVw4Jcl0SAMzUCEbPEGl7O9iEOv7vtZfdKuNb3xs9utzZT600u0hbKfoe', {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    const { priceId, isAnnual, userEmail } = body;

    if (!priceId) {
      console.error('Missing priceId in request');
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    if (!userEmail) {
      console.error('Missing userEmail in request');
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    console.log('Creating Stripe checkout session with:', {
      priceId,
      isAnnual,
      userEmail,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
      customer_email: userEmail,
      metadata: {
        isAnnual: isAnnual.toString(),
      },
    });

    console.log('Stripe session created:', session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 