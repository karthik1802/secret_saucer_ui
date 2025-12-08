import { useState, useEffect } from 'react';
import type { BookingFormData, GuestDetails } from '../types';

interface BookingFormProps {
  maxSeats: number;
  seatsLeft: number;
  pricePerSeat: number;
  onSubmit: (data: BookingFormData) => void;
  isSubmitting: boolean;
}

const emptyGuest = (): GuestDetails => ({
  name: '',
  email: '',
  phone: '',
});

export function BookingForm({
  maxSeats,
  seatsLeft,
  pricePerSeat,
  onSubmit,
  isSubmitting,
}: BookingFormProps) {
  const maxBookable = Math.min(5, seatsLeft, maxSeats);
  
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [qty, setQty] = useState(1);
  const [guests, setGuests] = useState<GuestDetails[]>([emptyGuest()]);

  // Sync guest count with qty
  useEffect(() => {
    setGuests((prev) => {
      if (qty > prev.length) {
        // Add more guests
        const newGuests = [...prev];
        while (newGuests.length < qty) {
          newGuests.push(emptyGuest());
        }
        return newGuests;
      } else if (qty < prev.length) {
        // Remove extra guests
        return prev.slice(0, qty);
      }
      return prev;
    });
  }, [qty]);

  // Pre-fill first guest from buyer details
  useEffect(() => {
    if (guests.length > 0) {
      const firstGuest = guests[0];
      if (!firstGuest.name && !firstGuest.email && !firstGuest.phone) {
        setGuests((prev) => {
          const newGuests = [...prev];
          newGuests[0] = {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone,
          };
          return newGuests;
        });
      }
    }
  }, [buyerName, buyerEmail, buyerPhone, guests]);

  const updateGuest = (index: number, field: keyof GuestDetails, value: string) => {
    setGuests((prev) => {
      const newGuests = [...prev];
      newGuests[index] = { ...newGuests[index], [field]: value };
      return newGuests;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      qty,
      guests,
    });
  };

  const totalAmount = qty * pricePerSeat;

  const inputClasses = `
    w-full px-4 py-3 rounded-lg border bg-transparent
    focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]
    transition-colors
  `;

  const labelClasses = `
    block text-sm uppercase tracking-wider mb-2
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Buyer Details */}
      <section>
        <h3 
          className="text-xl mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Your Details
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label 
              className={labelClasses}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Full Name *
            </label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Enter your name"
              className={inputClasses}
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          
          <div>
            <label 
              className={labelClasses}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email *
            </label>
            <input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="you@email.com"
              className={inputClasses}
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          
          <div>
            <label 
              className={labelClasses}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Phone *
            </label>
            <input
              type="tel"
              required
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              className={inputClasses}
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
        </div>
      </section>

      {/* Number of Seats */}
      <section>
        <h3 
          className="text-xl mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Number of Seats
        </h3>
        
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="w-12 h-12 rounded-lg border flex items-center justify-center text-xl font-medium transition-colors hover:border-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--color-border)' }}
          >
            −
          </button>
          
          <span 
            className="text-3xl font-medium w-16 text-center"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {qty}
          </span>
          
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxBookable, q + 1))}
            disabled={qty >= maxBookable}
            className="w-12 h-12 rounded-lg border flex items-center justify-center text-xl font-medium transition-colors hover:border-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: 'var(--color-border)' }}
          >
            +
          </button>
          
          <span 
            className="text-sm ml-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            (max {maxBookable} seats)
          </span>
        </div>
      </section>

      {/* Guest Details */}
      <section>
        <h3 
          className="text-xl mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Guest Details
        </h3>
        
        <div className="space-y-6">
          {guests.map((guest, index) => (
            <div 
              key={index}
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h4 
                className="text-sm uppercase tracking-wider mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-accent)' }}
              >
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-dark)' }}
                >
                  {index + 1}
                </span>
                Guest {index + 1} {index === 0 && '(You)'}
              </h4>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label 
                    className={labelClasses}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guest.name}
                    onChange={(e) => updateGuest(index, 'name', e.target.value)}
                    placeholder="Guest name"
                    className={inputClasses}
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
                
                <div>
                  <label 
                    className={labelClasses}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={guest.email}
                    onChange={(e) => updateGuest(index, 'email', e.target.value)}
                    placeholder="guest@email.com"
                    className={inputClasses}
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
                
                <div>
                  <label 
                    className={labelClasses}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guest.phone}
                    onChange={(e) => updateGuest(index, 'phone', e.target.value)}
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                    className={inputClasses}
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order Summary */}
      <section 
        className="p-6 rounded-lg border"
        style={{ 
          backgroundColor: 'rgba(201, 169, 97, 0.05)',
          borderColor: 'rgba(201, 169, 97, 0.2)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {qty} seat{qty > 1 ? 's' : ''} × ₹{pricePerSeat.toLocaleString('en-IN')}
          </span>
          <span 
            className="text-2xl font-medium"
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span 
                className="w-5 h-5 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--color-bg-dark)', borderTopColor: 'transparent' }}
              />
              Processing...
            </>
          ) : (
            <>
              Proceed to Pay
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </section>
    </form>
  );
}

