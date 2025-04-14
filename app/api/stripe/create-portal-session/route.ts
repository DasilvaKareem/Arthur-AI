import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe/config";
import { getAdminDb } from "../../../lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    console.log('Creating portal session for user:', userId);

    if (!userId) {
      console.error('Missing required parameter: userId');
      return NextResponse.json(
        { error: "Missing required parameter" },
        { status: 400 }
      );
    }

    const firestore = await getAdminDb();
    if (!firestore) {
      return NextResponse.json(
        { error: "Failed to initialize Firestore" },
        { status: 500 }
      );
    }
    
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error('User document not found:', userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;
    
    if (!customerId) {
      console.error('User has no Stripe customer ID:', userId);
      return NextResponse.json(
        { error: "No subscription found for this user" },
        { status: 400 }
      );
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace`,
    });

    console.log('Portal session created:', { 
      sessionId: session.id,
      url: session.url 
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', {
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