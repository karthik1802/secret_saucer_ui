import { Link, useLocation } from 'react-router-dom';

interface LocationState {
  eventName?: string;
  bookingId?: string;
  buyerEmail?: string;
}

export function ThankYouPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        {/* Success Icon */}
        <div 
          className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, rgba(201, 169, 97, 0.2) 0%, rgba(201, 169, 97, 0.1) 100%)',
            border: '2px solid var(--color-accent)',
          }}
        >
          <svg 
            className="w-10 h-10" 
            fill="none" 
            stroke="var(--color-accent)" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Message */}
        <h1 
          className="text-4xl sm:text-5xl mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Payment Received
        </h1>
        
        <p 
          className="text-lg mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Thank you for your booking!
        </p>

        {/* Details Card */}
        <div 
          className="p-6 rounded-lg border text-left mb-8"
          style={{ 
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          {state?.eventName && (
            <div className="mb-4">
              <p className="text-sm uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Event
              </p>
              <p className="font-medium" style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem' }}>
                {state.eventName}
              </p>
            </div>
          )}
          
          {state?.bookingId && (
            <div className="mb-4">
              <p className="text-sm uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Booking Reference
              </p>
              <p className="font-mono text-sm" style={{ color: 'var(--color-accent)' }}>
                {state.bookingId}
              </p>
            </div>
          )}
          
          <div 
            className="pt-4 mt-4 border-t text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <p className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>
                A confirmation email will be sent to {state?.buyerEmail || 'your email address'} shortly with all the event details.
              </span>
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div 
          className="p-4 rounded-lg text-sm text-left"
          style={{ 
            backgroundColor: 'rgba(201, 169, 97, 0.05)',
            border: '1px solid rgba(201, 169, 97, 0.2)',
          }}
        >
          <p className="font-medium mb-2" style={{ color: 'var(--color-accent)' }}>
            What's next?
          </p>
          <ul className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-accent)' }}>•</span>
              <span>Check your inbox for the confirmation email</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-accent)' }}>•</span>
              <span>Save the event date to your calendar</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-accent)' }}>•</span>
              <span>Arrive 10-15 minutes before the event starts</span>
            </li>
          </ul>
        </div>

        {/* Back to Events */}
        <Link
          to="/"
          className="btn-primary inline-block mt-8"
        >
          Browse More Events
        </Link>
      </div>
    </div>
  );
}

