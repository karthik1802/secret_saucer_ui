export interface Event {
  event_id: string;
  name: string;
  date_iso: string;
  venue: string;
  price_inr: number;
  max_seats: number;
  seats_left: number;
  is_active: boolean;
}

export interface EventsResponse {
  ok: boolean;
  events?: Event[];
  error?: string;
}

export interface CreateOrderParams {
  event_id: string;
  qty: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  [key: string]: string | number; // For guest1_name, guest2_name, etc.
}

export interface CreateOrderResponse {
  ok: boolean;
  order_id?: string;
  key_id?: string;
  amount?: number;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  client_token?: string;
  booking_id?: string;
  event_name?: string;
  error?: string;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

export interface BookingFormData {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  qty: number;
  guests: GuestDetails[];
}

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
}

