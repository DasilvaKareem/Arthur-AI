import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebase-admin";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    const userDoc = await firestore.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Strip any sensitive information before returning
    const safeUserData = {
      uid: userId,
      email: userData?.email,
      displayName: userData?.displayName,
      photoURL: userData?.photoURL,
      
      // Subscription related fields
      stripeCustomerId: userData?.stripeCustomerId,
      subscriptionStatus: userData?.subscriptionStatus,
      subscriptionId: userData?.subscriptionId,
      
      // If there's trial data
      trialEnd: userData?.trialEnd,
      
      // Any additional non-sensitive user data
      createdAt: userData?.createdAt,
      updatedAt: userData?.updatedAt,
    };

    return NextResponse.json(safeUserData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
} 