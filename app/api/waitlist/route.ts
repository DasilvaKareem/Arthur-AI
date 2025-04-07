import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    console.log("📧 Waitlist request received for:", email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if the API key is available
    if (!process.env.BREVO_API_KEY) {
      console.error("❌ Brevo API key is missing");
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }

    // Simplified approach - just add to contact list without double opt-in
    // This is more reliable than the double opt-in endpoint
    const requestBody = {
      email,
      attributes: {
        SOURCE: 'Website Waitlist'
      },
      listIds: [4]  // ArthurAI#4 List
    };

    console.log("📝 Request to Brevo:", JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(requestBody)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { text: await response.text().catch(() => "No response body") };
    }
    
    console.log("📊 Brevo API status:", response.status, response.statusText);
    console.log("📄 Brevo API response:", responseData);

    // Handle the case where the contact already exists (which returns a 400 error)
    if (response.status === 400 && 
        (responseData?.message?.includes("Contact already exist") || 
         responseData?.code === "duplicate_parameter")) {
      console.log("ℹ️ Contact already exists, considering this a success");
      return NextResponse.json(
        { message: 'You are already on the waitlist' },
        { status: 200 }
      );
    }

    if (!response.ok) {
      console.error('❌ Brevo API error:', responseData);
      return NextResponse.json(
        { error: 'Failed to add to waitlist', details: responseData },
        { status: response.status }
      );
    }

    console.log("✅ Successfully added to waitlist");
    
    return NextResponse.json(
      { message: 'Successfully added to waitlist' },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Waitlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 