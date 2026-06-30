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

    const { plan } = await req.json();
    if (!plan || !PRICE_IDS[plan]) {
      return Response.json({ error: 'Invalid or unrecognized plan' }, { status: 400 });
    }
    const priceId = PRICE_IDS[plan];

    // Construct redirect URLs from the server-side app ID only — never from
    // client-supplied Origin headers or body parameters — to prevent open redirect.
    const appId = Deno.env.get('BASE44_APP_ID');
    if (!appId) {
      return Response.json({ error: 'Server misconfiguration: missing app ID' }, { status: 500 });
    }
    const safeOrigin = `https://${appId}.base44.app`;
    const safeSuccessUrl = `${safeOrigin}/settings?upgraded=true`;
    const safeCancelUrl = `${safeOrigin}/settings`;

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