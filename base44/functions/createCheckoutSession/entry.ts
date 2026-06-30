import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICE_IDS = {
  pro_monthly: 'price_1TWrqeE9ea3XI86gpmSrvcPg',
  pro_yearly: 'price_1TWrqgE9ea3XI86gTz4cyad4',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success_url, cancel_url, plan = 'pro_monthly' } = await req.json();
    const priceId = PRICE_IDS[plan] || PRICE_IDS.pro_monthly;

    // Only allow relative paths for redirect URLs to prevent open redirect attacks
    const origin = req.headers.get('origin') || '';
    const safeSuccessUrl = (typeof success_url === 'string' && success_url.startsWith('/'))
      ? `${origin}${success_url}`
      : `${origin}/settings?upgraded=true`;
    const safeCancelUrl = (typeof cancel_url === 'string' && cancel_url.startsWith('/'))
      ? `${origin}${cancel_url}`
      : `${origin}/settings`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
      },
      subscription_data: {
        metadata: {
          user_email: user.email,
        },
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});