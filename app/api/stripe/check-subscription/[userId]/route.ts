import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID" },
        { status: 400 }
      );
    }

    const firestore = await getAdminDb();
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const now = Date.now();

    // Check subscription status
    const hasActiveSubscription = userData?.isSubscribed && 
      userData?.stripeCurrentPeriodEnd && 
      userData?.stripeCurrentPeriodEnd > now;

    // Check trial status
    const hasActiveTrial = userData?.isTrialing && 
      userData?.trialEnd && 
      userData?.trialEnd > now;

    // If trial has expired, update the status
    if (userData?.isTrialing && userData?.trialEnd && userData?.trialEnd <= now) {
      await userDoc.ref.update({
        isTrialing: false,
      });
    }

    return NextResponse.json({
      hasAccess: hasActiveSubscription || hasActiveTrial,
      isSubscribed: hasActiveSubscription,
      isTrialing: hasActiveTrial,
      trialEnd: userData?.trialEnd,
      subscriptionEnd: userData?.stripeCurrentPeriodEnd,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 