# Secret Saucer UI

A React frontend for the Secret Saucer events/booking website that integrates with Google Apps Script backend and Razorpay for payments.

## Features

- 🎫 Event listing with real-time availability
- 👥 Multi-seat bookings with guest details
- 💳 Razorpay payment integration
- 📱 Responsive, mobile-friendly design
- ✨ Beautiful dark theme with elegant typography

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS v4
- **Routing:** React Router v7
- **Payments:** Razorpay Checkout SDK

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google Apps Script Web App URL (backend)
- Razorpay account (keys returned by your Apps Script backend)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd secret_saucer_ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your VITE_WEBAPP_URL
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Production Build

```bash
npm run build
npm run preview
```

## Configuration

Create a `.env` file in the project root:

```env
# Required: Your Google Apps Script Web App URL
VITE_WEBAPP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Project Structure

```
src/
├── main.tsx              # App entry point
├── App.tsx               # Router setup
├── index.css             # Global styles & Tailwind
├── types/
│   └── index.ts          # TypeScript interfaces
├── lib/
│   ├── api.ts            # Apps Script API client
│   └── razorpay.ts       # Razorpay checkout utility
├── components/
│   ├── EventCard.tsx     # Event listing card
│   ├── BookingForm.tsx   # Multi-guest booking form
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
└── routes/
    ├── EventsPage.tsx    # / or /events - Event listing
    ├── BookEventPage.tsx # /book/:eventId - Booking flow
    └── ThankYouPage.tsx  # /thank-you - Success page
```

## API Endpoints

The frontend expects these endpoints from your Apps Script backend:

### GET `?action=publicEvents`

Returns list of active events with availability.

### GET `?action=createOrder&...`

Creates a Razorpay order and returns payment details.

## Flow

1. User visits `/` or `/events` to see available events
2. Clicks "Book Now" on an available event
3. Fills in buyer details and guest information
4. Clicks "Proceed to Pay"
5. Frontend calls `createOrder` endpoint
6. On success, Razorpay Checkout opens
7. After payment, user is redirected to `/thank-you`
8. Backend webhook handles confirmation and emails

## License

Private - All rights reserved.
