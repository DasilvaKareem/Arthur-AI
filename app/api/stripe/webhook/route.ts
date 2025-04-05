import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "../../../lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const firestore = await getAdminDb();
    if (!firestore) {
      return NextResponse.json(
        { error: "Failed to initialize Firestore" },
        { status: 500 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session & {
          metadata: { firebaseUID: string };
          subscription: string;
        };
        const userId = session.metadata?.firebaseUID;
        
        if (!userId) {
          return NextResponse.json(
            { error: "Missing user ID in session metadata" },
            { status: 400 }
          );
        }

        const userDoc = firestore.collection("users").doc(userId);

        await userDoc.update({
          stripeCustomerId: session.customer,
          subscriptionStatus: "active",
          subscriptionId: session.subscription,
          updatedAt: new Date(),
        });

        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription & {
          metadata: { firebaseUID: string };
        };
        const userId = subscription.metadata?.firebaseUID;
        
        if (!userId) {
          return NextResponse.json(
            { error: "Missing user ID in subscription metadata" },
            { status: 400 }
          );
        }

        const userDoc = firestore.collection("users").doc(userId);
        const status = subscription.status;

        await userDoc.update({
          subscriptionStatus: status,
          updatedAt: new Date(),
        });

        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription & {
          metadata: { firebaseUID: string };
        };
        const userId = subscription.metadata?.firebaseUID;
        
        if (!userId) {
          return NextResponse.json(
            { error: "Missing user ID in subscription metadata" },
            { status: 400 }
          );
        }

        const userDoc = firestore.collection("users").doc(userId);

        await userDoc.update({
          subscriptionStatus: "canceled",
          updatedAt: new Date(),
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("❌ Webhook error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 