import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const PRO_PRICE_ID = 'price_1TWqKiE9ea3XI86gAYkxVZBZ';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success_url, cancel_url } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/settings?upgraded=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/settings`,
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