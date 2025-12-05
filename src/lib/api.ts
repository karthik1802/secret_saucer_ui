import type { Event, EventsResponse, CreateOrderParams, CreateOrderResponse } from '../types';

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !WEBAPP_URL;

if (!WEBAPP_URL && !USE_MOCK) {
  console.warn('VITE_WEBAPP_URL is not set. Set VITE_USE_MOCK=true to use mock data.');
}

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================
const MOCK_EVENTS: Event[] = [
  {
    event_id: 'SUPPER-012',
    name: 'Supper Club #12',
    date_iso: '2025-12-15T19:30:00+05:30',
    venue: 'Indiranagar Studio',
    price_inr: 1500,
    max_seats: 20,
    seats_left: 6,
    is_active: true,
  },
  {
    event_id: 'SUPPER-013',
    name: "New Year's Eve Special",
    date_iso: '2025-12-31T20:00:00+05:30',
    venue: 'Koramangala Terrace',
    price_inr: 2500,
    max_seats: 30,
    seats_left: 12,
    is_active: true,
  },
  {
    event_id: 'SUPPER-014',
    name: 'Winter Tasting Menu',
    date_iso: '2026-01-10T19:00:00+05:30',
    venue: 'Whitefield Bungalow',
    price_inr: 1800,
    max_seats: 16,
    seats_left: 3,
    is_active: true,
  },
  {
    event_id: 'SUPPER-011',
    name: 'Supper Club #11',
    date_iso: '2025-11-20T19:30:00+05:30',
    venue: 'HSR Layout Studio',
    price_inr: 1500,
    max_seats: 20,
    seats_left: 0,
    is_active: false,
  },
];

async function mockDelay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockFetchEvents(): Promise<Event[]> {
  await mockDelay();
  console.log('🔶 Using mock data (set VITE_WEBAPP_URL to use real API)');
  return MOCK_EVENTS;
}

async function mockCreateOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  await mockDelay(1200);
  
  const event = MOCK_EVENTS.find((e) => e.event_id === params.event_id);
  
  if (!event) {
    return { ok: false, error: 'Event not found' };
  }
  
  if (!event.is_active || event.seats_left < params.qty) {
    return { ok: false, error: 'Not enough seats available' };
  }
  
  // Generate mock order response
  const orderId = `order_mock_${Date.now()}`;
  const bookingId = `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 100000)}`;
  
  return {
    ok: true,
    order_id: orderId,
    key_id: 'rzp_test_mock123456789', // Mock key - won't work with real Razorpay
    amount: params.qty * event.price_inr * 100, // Convert to paise
    buyer_name: params.buyer_name,
    buyer_email: params.buyer_email,
    buyer_phone: params.buyer_phone,
    client_token: `mock_token_${Date.now()}`,
    booking_id: bookingId,
    event_name: event.name,
  };
}

// ============================================
// REAL API FUNCTIONS
// ============================================

/**
 * Helper to call Google Apps Script Web App
 * Uses proper configuration to handle CORS and redirects
 */
async function callAppsScript(url: string): Promise<Response> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow', // Follow Google's redirects
      // Don't send custom headers - they trigger CORS preflight
    });
    return res;
  } catch (error) {
    // Network error or CORS error
    console.error('Fetch error:', error);
    throw new Error(
      'Network error. Please check:\n' +
      '1. Your Apps Script is deployed as Web App with "Anyone" access\n' +
      '2. The VITE_WEBAPP_URL is correct\n' +
      '3. Your Apps Script doGet() returns ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)'
    );
  }
}

/**
 * Fetch all public events
 */
export async function fetchEvents(): Promise<Event[]> {
  if (USE_MOCK) {
    return mockFetchEvents();
  }
  
  const res = await callAppsScript(`${WEBAPP_URL}?action=publicEvents`);
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  // Get response text first to handle potential non-JSON responses
  const text = await res.text();
  
  try {
    const data: EventsResponse = JSON.parse(text);
    
    if (!data.ok) {
      throw new Error(data.error || 'Failed to load events');
    }
    
    return data.events || [];
  } catch (parseError) {
    console.error('Failed to parse response:', text.slice(0, 500));
    throw new Error('Invalid JSON response from server. Check Apps Script configuration.');
  }
}

/**
 * Create a Razorpay order and pre-save booking
 * Uses POST with form data to avoid CORS preflight issues
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  if (USE_MOCK) {
    return mockCreateOrder(params);
  }
  
  // Build form data
  const formData = new URLSearchParams();
  formData.append('action', 'createOrder');
  formData.append('event_id', params.event_id);
  formData.append('qty', params.qty.toString());
  formData.append('buyer_name', params.buyer_name);
  formData.append('buyer_email', params.buyer_email);
  formData.append('buyer_phone', params.buyer_phone);
  
  // Add guest details
  Object.keys(params).forEach((key) => {
    if (key.startsWith('guest')) {
      formData.append(key, params[key].toString());
    }
  });

  try {
    // Use POST with form data - this is a "simple request" that avoids CORS preflight
    const res = await fetch(WEBAPP_URL, {
      method: 'POST',
      redirect: 'follow',
      body: formData,
      // Content-Type is automatically set to application/x-www-form-urlencoded for URLSearchParams
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    // Get response text first to handle potential non-JSON responses
    const text = await res.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response:', text.slice(0, 500));
      throw new Error('Invalid JSON response from server. Check Apps Script configuration.');
    }
  } catch (error) {
    console.error('CreateOrder error:', error);
    
    // If POST fails, try GET as fallback (in case Apps Script only has doGet)
    console.log('Trying GET fallback...');
    const res = await callAppsScript(`${WEBAPP_URL}?${formData.toString()}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const text = await res.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response:', text.slice(0, 500));
      throw new Error('Network error creating order. Please check your Apps Script configuration.');
    }
  }
}

/**
 * Format price in INR
 */
export function formatPrice(priceInr: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInr);
}

/**
 * Format date from ISO string
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format time from ISO string
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format full date and time
 */
export function formatDateTime(isoString: string): string {
  return `${formatDate(isoString)} • ${formatTime(isoString)}`;
}
