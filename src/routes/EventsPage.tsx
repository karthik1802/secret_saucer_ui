import { useEffect, useState } from 'react';
import { EventCard } from '../components/EventCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { fetchEvents } from '../lib/api';
import type { Event } from '../types';

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative py-20 px-6 text-center overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(201, 169, 97, 0.15) 0%, transparent 60%)',
          }}
        />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <p 
            className="text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--color-accent)' }}
          >
            An invitation to experience
          </p>
          
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl mb-6"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}
          >
            Secret Saucer
          </h1>
          
          <p 
            className="text-lg max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Intimate gatherings. Extraordinary experiences. Limited seats.
          </p>
        </div>

        {/* Decorative elements */}
        <div 
          className="absolute left-1/2 bottom-0 w-px h-16 -translate-x-1/2"
          style={{ 
            background: 'linear-gradient(to bottom, transparent, var(--color-accent))',
          }}
        />
      </header>

      {/* Events Section */}
      <main className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <h2 
              className="text-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Upcoming Events
            </h2>
            <div 
              className="flex-1 h-px"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
          </div>

          {loading ? (
            <div className="py-20">
              <LoadingSpinner size="lg" message="Loading events..." />
            </div>
          ) : error ? (
            <div className="py-20">
              <ErrorMessage 
                message={error} 
                onRetry={loadEvents}
              />
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No upcoming events at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((event, index) => (
                <EventCard 
                  key={event.event_id} 
                  event={event} 
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="py-8 px-6 text-center text-sm border-t"
        style={{ 
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <p>© {new Date().getFullYear()} Secret Saucer. All rights reserved.</p>
      </footer>
    </div>
  );
}

