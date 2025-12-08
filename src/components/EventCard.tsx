import { Link } from 'react-router-dom';
import type { Event } from '../types';
import { formatDate, formatPrice } from '../lib/api';

interface EventCardProps {
  event: Event;
  index: number;
}

export function EventCard({ event, index }: EventCardProps) {
  const isSoldOut = !event.is_active || event.seats_left <= 0;
  const isLowStock = event.seats_left > 0 && event.seats_left <= 5;

  return (
    <article
      className="group relative overflow-hidden rounded-lg border transition-all duration-500 hover:border-[var(--color-accent)]/50 hover:shadow-[0_0_40px_rgba(201,169,97,0.1)]"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
        <div 
          className="absolute -top-10 -right-10 w-20 h-20 rotate-45 opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ backgroundColor: 'var(--color-accent)' }}
        />
      </div>

      <div className="p-6 sm:p-8">
        {/* Event Name */}
        <h3 
          className="text-2xl sm:text-3xl mb-4 group-hover:text-[var(--color-accent)] transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {event.name}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(event.date_iso)}</span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{event.venue}</span>
        </div>

        {/* Divider */}
        <div className="h-px mb-6 opacity-30" style={{ backgroundColor: 'var(--color-border)' }} />

        {/* Price & Availability */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Per seat
            </p>
            <p className="text-2xl font-medium" style={{ color: 'var(--color-accent)' }}>
              {formatPrice(event.price_inr)}
            </p>
          </div>

          <div className="text-right">
            {isSoldOut ? (
              <span 
                className="inline-block px-4 py-2 rounded text-sm font-medium uppercase tracking-wider"
                style={{ 
                  backgroundColor: 'rgba(248, 113, 113, 0.1)',
                  color: 'var(--color-error)',
                }}
              >
                Sold Out
              </span>
            ) : (
              <>
                <p 
                  className={`text-sm mb-2 ${isLowStock ? 'font-medium' : ''}`}
                  style={{ color: isLowStock ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                >
                  {isLowStock ? `Only ${event.seats_left} left!` : `${event.seats_left} seats left`}
                </p>
                <Link
                  to={`/book/${event.event_id}`}
                  className="btn-primary inline-block"
                >
                  Book Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

