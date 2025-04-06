import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        email,
        attributes: {
          SOURCE: 'Website Waitlist'
        },
        includeListIds: [2], // Replace with your actual list ID
        templateId: 1, // Replace with your actual template ID
        redirectionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/waitlist-confirmed`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Brevo API error:', error);
      return NextResponse.json(
        { error: 'Failed to add to waitlist' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'Successfully added to waitlist' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 