import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookingForm } from '../components/BookingForm';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { fetchEvents, createOrder, formatDate, formatTime, formatPrice } from '../lib/api';
import { openRazorpayCheckout } from '../lib/razorpay';
import type { Event, BookingFormData, CreateOrderParams } from '../types';

export function BookEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const events = await fetchEvents();
        const found = events.find((e) => e.event_id === eventId);
        if (!found) {
          setError('Event not found');
        } else if (!found.is_active || found.seats_left <= 0) {
          setError('This event is no longer available for booking');
        } else {
          setEvent(found);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const handleSubmit = async (formData: BookingFormData) => {
    if (!event) return;
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Build params object
      const params: CreateOrderParams = {
        event_id: event.event_id,
        qty: formData.qty,
        buyer_name: formData.buyer_name,
        buyer_email: formData.buyer_email,
        buyer_phone: formData.buyer_phone,
      };
      
      // Add guest details
      formData.guests.forEach((guest, index) => {
        const guestNum = index + 1;
        params[`guest${guestNum}_name`] = guest.name;
        params[`guest${guestNum}_email`] = guest.email;
        params[`guest${guestNum}_phone`] = guest.phone;
      });
      
      const response = await createOrder(params);
      
      if (!response.ok) {
        setSubmitError(response.error || 'Failed to create order');
        return;
      }
      
      // Open Razorpay checkout
      openRazorpayCheckout({
        orderData: response,
        eventName: event.name,
        onSuccess: () => {
          navigate('/thank-you', { 
            state: { 
              eventName: event.name,
              bookingId: response.booking_id,
              buyerEmail: formData.buyer_email,
            } 
          });
        },
        onDismiss: () => {
          setSubmitError('Payment was cancelled. Please try again.');
        },
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading event details..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <ErrorMessage message={error || 'Event not found'} />
          <Link 
            to="/" 
            className="inline-block mt-6 text-sm hover:underline"
            style={{ color: 'var(--color-accent)' }}
          >
            ← Back to events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header 
        className="py-6 px-6 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--color-accent)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to events
          </Link>
          
          <span 
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Secure Checkout
          </span>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Event Summary */}
          <section 
            className="mb-12 p-8 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            <h1 
              className="text-3xl sm:text-4xl mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {event.name}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.date_iso)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(event.date_iso)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.venue}</span>
              </div>
              
              <div className="flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span>{formatPrice(event.price_inr)} / seat</span>
              </div>
            </div>
            
            {event.seats_left <= 5 && (
              <p 
                className="mt-4 text-sm font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                ⚡ Only {event.seats_left} seats left!
              </p>
            )}
          </section>

          {/* Error Message */}
          {submitError && (
            <div className="mb-8">
              <ErrorMessage 
                title="Booking Error" 
                message={submitError} 
              />
            </div>
          )}

          {/* Booking Form */}
          <BookingForm
            maxSeats={event.max_seats}
            seatsLeft={event.seats_left}
            pricePerSeat={event.price_inr}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        </div>
      </main>
    </div>
  );
}

