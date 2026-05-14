import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error', { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email || session.customer_email;

      if (userEmail) {
        await updateUserPlan(base44, userEmail, 'pro_monthly');
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userEmail = subscription.metadata?.user_email;

      if (userEmail) {
        await updateUserPlan(base44, userEmail, 'free');
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      const userEmail = sub.metadata?.user_email;

      if (userEmail) {
        console.log(`Payment failed for user: ${userEmail}`);
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});

async function updateUserPlan(base44, userEmail, plan) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
  if (profiles.length > 0) {
    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, { plan });
    console.log(`Updated ${userEmail} to plan: ${plan}`);
  } else {
    console.log(`No profile found for ${userEmail}`);
  }
}