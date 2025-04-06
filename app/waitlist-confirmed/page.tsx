import Link from 'next/link';

export default function WaitlistConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Access Request Confirmed!</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for requesting access. We've sent a confirmation email to your inbox.
            Please check your email and click the confirmation link to complete your request.
          </p>
        </div>
        
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-primary hover:text-primary/90 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 