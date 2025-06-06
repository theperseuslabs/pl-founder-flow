import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RUEZa4Eyt5i6lfnUEOCiFLDzHysJA4cHMzCPxL1sfx49xzLQSjEKxplKO6cpDAQlc1W6njNwvcrtZQyyDsVykJb00BSD8yjY9');

export const createCheckoutSession = async (priceId: string, isAnnual: boolean, userEmail: string) => {
  try {
    if (!userEmail) {
      throw new Error('User email is required');
    }

    console.log('Creating checkout session with:', {
      priceId,
      isAnnual,
      userEmail
    });

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        isAnnual,
        userEmail,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    console.log('Checkout session created:', sessionId);

    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }

    console.log('Redirecting to checkout...');
    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Checkout error details:', error);
    throw error;
  }
};

export const checkSubscriptionStatus = async (userEmail: string) => {
  try {
    const response = await fetch('/api/check-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userEmail }),
    });

    if (!response.ok) {
      throw new Error('Failed to check subscription status');
    }

    const data = await response.json();
    return data.isSubscribed;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

export const PRODUCT_IDS = {
  MONTHLY: 'price_1RWswA4Eyt5i6lfn0OwqcETI',
  ANNUAL: 'price_1RWswi4Eyt5i6lfniUtv8ljY',
}; 