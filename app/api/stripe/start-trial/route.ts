import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const TRIAL_PERIOD_DAYS = 14;

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

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
    if (userData?.isTrialing || userData?.isSubscribed) {
      return NextResponse.json(
        { error: "User already has an active trial or subscription" },
        { status: 400 }
      );
    }

    // Set trial period
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + TRIAL_PERIOD_DAYS);

    await userDoc.ref.update({
      isTrialing: true,
      trialEnd: trialEnd.getTime(),
      trialStarted: now.getTime(),
    });

    return NextResponse.json({
      success: true,
      trialEnd: trialEnd.getTime(),
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 