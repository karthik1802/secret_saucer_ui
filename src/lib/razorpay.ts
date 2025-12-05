import type { CreateOrderResponse, RazorpayOptions } from '../types';

interface OpenCheckoutParams {
  orderData: CreateOrderResponse;
  eventName?: string;
  onSuccess: () => void;
  onDismiss?: () => void;
}

/**
 * Opens Razorpay Checkout with the provided order data
 */
export function openRazorpayCheckout({
  orderData,
  eventName,
  onSuccess,
  onDismiss,
}: OpenCheckoutParams): void {
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded. Please check your internet connection.');
  }

  if (!orderData.key_id || !orderData.order_id || !orderData.amount) {
    throw new Error('Invalid order data. Missing required fields.');
  }

  const options: RazorpayOptions = {
    key: orderData.key_id,
    amount: orderData.amount, // in paise
    currency: 'INR',
    name: 'Secret Saucer',
    description: eventName || orderData.event_name || 'Event Booking',
    order_id: orderData.order_id,
    prefill: {
      name: orderData.buyer_name,
      email: orderData.buyer_email,
      contact: orderData.buyer_phone,
    },
    notes: {
      client_token: orderData.client_token || '',
      booking_id: orderData.booking_id || '',
    },
    handler: function (response) {
      // Payment successful on frontend
      // Real confirmation and emails are handled by backend webhook
      console.log('Payment successful:', response);
      onSuccess();
    },
    modal: {
      ondismiss: function () {
        // User closed the popup without completing payment
        console.log('Payment popup closed');
        onDismiss?.();
      },
    },
    theme: {
      color: '#c9a961',
    },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
}

