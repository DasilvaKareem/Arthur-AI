import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const firestore = await getAdminDb();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata.firebaseUID;
        const userDoc = firestore.collection("users").doc(userId);

        await userDoc.update({
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          isSubscribed: true,
          isCanceled: false,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        const userId = subscription.metadata.firebaseUID;

        if (userId) {
          const userDoc = firestore.collection("users").doc(userId);
          await userDoc.update({
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: subscription.current_period_end * 1000,
            isSubscribed: true,
            isCanceled: false,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata.firebaseUID;

        if (userId) {
          const userDoc = firestore.collection("users").doc(userId);
          await userDoc.update({
            isSubscribed: false,
            isCanceled: true,
            stripePriceId: null,
            stripeSubscriptionId: null,
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 