import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase manually - we can't rely on client-side initialization
    let firestore;
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      
      // Initialize or get the Firebase app
      const apps = getApps();
      const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
      firestore = getFirestore(app);
    } catch (initError) {
      console.error('Firebase initialization error:', initError);
      return NextResponse.json({ error: 'Failed to initialize Firebase' }, { status: 500 });
    }
    
    if (!firestore) {
      return NextResponse.json({ error: 'Failed to initialize Firestore' }, { status: 500 });
    }

    // Get shot data from the request body
    const data = await request.json();
    const { storyId, type, description, prompt, hasDialogue, hasNarration, hasSoundEffects, userId } = data;
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Get the story directly
    try {
      // Get the story document with a direct reference
      const storyRef = doc(firestore, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }
      
      const storyData = storyDoc.data();
      
      // Verify user has access to this story - if userId was provided in the request
      if (userId && storyData.userId !== userId) {
        return NextResponse.json({ error: 'Access denied to this story' }, { status: 403 });
      }
      
      // Path structure: /stories/{storyId}/scenes/{sceneId}/shots/{shotId}
      // Get all scenes for this story using the proper collection reference
      const scenesCollectionRef = collection(firestore, 'stories', storyId, 'scenes');
      const scenesSnapshot = await getDocs(scenesCollectionRef);
      
      // Determine scene to use
      let sceneId: string;
      
      if (!scenesSnapshot.empty) {
        // Use the first scene
        sceneId = scenesSnapshot.docs[0].id;
        console.log(`Using existing scene ${sceneId} for new shot`);
      } else {
        // Create a default scene
        console.log('No scenes found, creating a default scene');
        const newSceneData = {
          title: "Scene 1",
          location: "Default Location",
          description: "Default scene description",
          lighting: "NATURAL",
          weather: "CLEAR",
          style: "CINEMATIC",
          createdAt: serverTimestamp()
        };
        
        try {
          // Create the scene directly with collection reference
          const scenesRef = collection(firestore, 'stories', storyId, 'scenes');
          const newSceneRef = await addDoc(scenesRef, newSceneData);
          sceneId = newSceneRef.id;
          console.log(`Created new scene ${sceneId} for shot`);
        } catch (sceneError) {
          console.error('Error creating scene:', sceneError);
          throw new Error('Failed to create scene: ' + (sceneError instanceof Error ? sceneError.message : 'Unknown error'));
        }
      }
      
      // Create the shot in the selected scene
      const shotData = {
        type: type || "MEDIUM SHOT",
        description: description || "",
        prompt: prompt || description || "",
        hasDialogue: hasDialogue || false,
        hasNarration: hasNarration || false,
        hasSoundEffects: hasSoundEffects || false,
        createdAt: serverTimestamp()
      };
      
      // Use direct collection reference for shots
      try {
        const shotsRef = collection(firestore, 'stories', storyId, 'scenes', sceneId, 'shots');
        const newShotRef = await addDoc(shotsRef, shotData);
        const shotId = newShotRef.id;
        
        // Return success response
        return NextResponse.json({
          id: shotId,
          sceneId: sceneId,
          message: 'Shot created successfully'
        });
      } catch (shotError) {
        console.error('Error creating shot:', shotError);
        throw new Error('Failed to create shot: ' + (shotError instanceof Error ? shotError.message : 'Unknown error'));
      }
    } catch (storyError) {
      console.error('Error accessing story or creating shot:', storyError);
      return NextResponse.json(
        { error: 'Failed to access or create story structure: ' + (storyError instanceof Error ? storyError.message : 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating shot:', error);
    return NextResponse.json(
      { error: 'Failed to create shot: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 