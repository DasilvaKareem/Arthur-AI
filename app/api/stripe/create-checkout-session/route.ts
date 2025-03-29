import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json();

    console.log('Creating checkout session with:', { priceId, userId });

    if (!priceId || !userId) {
      console.error('Missing required parameters:', { priceId, userId });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const firestore = await getAdminDb();
    console.log('Firestore initialized');

    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error('User document not found:', userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    console.log('User data retrieved:', { 
      hasStripeCustomerId: !!userData?.stripeCustomerId 
    });

    // Create or retrieve customer
    let customerId = userData?.stripeCustomerId;
    if (!customerId) {
      console.log('Creating new Stripe customer');
      const customer = await stripe.customers.create({
        metadata: {
          firebaseUID: userId,
        },
      });
      customerId = customer.id;
      await userDoc.ref.update({ stripeCustomerId: customerId });
      console.log('Created new customer:', customerId);
    }

    // Create checkout session
    console.log('Creating checkout session');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard-app?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard-app/subscription?canceled=true`,
      metadata: {
        firebaseUID: userId,
      },
    });

    console.log('Checkout session created:', { 
      sessionId: session.id,
      url: session.url 
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', {
      error: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    // Return more specific error messages
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 