/***** CONFIG *****/
const SPREADSHEET_ID = '1Xr6BOMdnVT2XxGM16leDoGqy6AgtM6RzVUTmqr5vsNA';
const SHEET_EVENTS = 'Events';
const SHEET_BOOKINGS = 'Bookings';
const SHEET_GUESTS = 'Guests';
const SHEET_SETTINGS = 'Settings';

const RZP_ORDERS_URL = 'https://api.razorpay.com/v1/orders';
const RZP_REFUND_URL = (paymentId) => `https://api.razorpay.com/v1/payments/${paymentId}/refund`;

/***** UTILITIES *****/
function ss() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function getSheet(name){ return ss().getSheetByName(name); }
function nowISO(){ return new Date().toISOString(); }

function getSettings() {
  const sh = getSheet(SHEET_SETTINGS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return {}; // no settings rows yet
  const data = sh.getRange(2, 1, lastRow - 1, 2).getValues();
  const obj = {};
  data.forEach(([k, v]) => { if (k) obj[k] = v; });
  return obj;
}

function basicAuthHeader(key, secret) {
  const token = Utilities.base64Encode(`${key}:${secret}`);
  return { 'Authorization': `Basic ${token}` };
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function findEventRowById(eventId){
  const sh = getSheet(SHEET_EVENTS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return null; // no events yet
  const vals = sh.getRange(2, 1, lastRow - 1, 8).getValues(); // A:H
  for (let i = 0; i < vals.length; i++){
    if (vals[i][0] === eventId) return {row: i + 2, data: vals[i]};
  }
  return null;
}

function countConfirmedSeats(eventId){
  const sh = getSheet(SHEET_BOOKINGS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return 0; // no bookings yet
  const vals = sh.getRange(2, 1, lastRow - 1, 7).getValues(); // A:G
  let total = 0;
  for (let i = 0; i < vals.length; i++){
    const row = vals[i];
    const evt = row[2];
    const status = row[5];
    const qty = Number(row[6] || 0);
    if (evt === eventId && status === 'CONFIRMED') total += qty;
  }
  return total;
}

function upsertBookingAndGuests(payload) {
  // payload: {event_id, qty, buyer_name, buyer_email, buyer_phone, guests:[{name,email,phone}...], client_token, order_id?, payment_id?}
  const bkSh = getSheet(SHEET_BOOKINGS);
  const gSh = getSheet(SHEET_GUESTS);

  // BOOKINGS: safe read
  let all = [];
  let lastRowBk = bkSh.getLastRow();
  if (lastRowBk >= 2) {
    all = bkSh.getRange(2, 1, lastRowBk - 1, 12).getValues(); // A:L
  }

  let rowIndex = -1, bookingId = null;

  // Try match by client_token
  for (let i = 0; i < all.length; i++){
    if (all[i][1] === payload.client_token) { rowIndex = i + 2; bookingId = all[i][0]; break; }
  }
  if (!bookingId) {
    // Create new booking_id
    bookingId = `BK-${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd')}-${Math.floor(10000 + Math.random()*89999)}`;
    const row = [
      bookingId,
      payload.client_token,
      payload.event_id,
      payload.buyer_name,
      payload.buyer_email,
      payload.status || 'PENDING',
      Number(payload.qty),
      payload.payment_id || '',
      payload.order_id || '',
      Number(payload.amount_inr || 0),
      nowISO(),
      nowISO(),
    ];
    bkSh.appendRow(row);
  } else {
    // Update existing row
    const updates = {
      6: payload.status,        // F
      8: payload.payment_id,    // H
      9: payload.order_id,      // I
      10: Number(payload.amount_inr || 0), // J
      12: nowISO(),             // L
    };
    Object.keys(updates).forEach(c => {
      if (typeof updates[c] !== 'undefined' && updates[c] !== null) {
        bkSh.getRange(rowIndex, Number(c), 1, 1).setValue(updates[c]);
      }
    });
  }

  // Upsert guests: delete old guests for this booking_id, then insert fresh
  let gAll = [];
  let lastRowG = gSh.getLastRow();
  if (lastRowG >= 2) {
    gAll = gSh.getRange(2, 1, lastRowG - 1, 5).getValues(); // A:E
  }
  const toDelete = [];
  for (let i = 0; i < gAll.length; i++){ if (gAll[i][0] === bookingId) toDelete.push(i + 2); }
  // Delete bottom-up
  toDelete.sort((a,b)=>b-a).forEach(r => gSh.deleteRow(r));
  // Insert now
  const rows = [];
  (payload.guests || []).forEach((g, idx) => {
    rows.push([bookingId, idx + 1, g.name || '', g.email || '', g.phone || '']);
  });
  if (rows.length) {
    gSh.getRange(gSh.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
  }

  return bookingId;
}

/***** ACTION: createOrder (called from frontend) *****/
function handleCreateOrder(params) {
  const settings = getSettings();
  const keyId = settings.RZP_KEY_ID;
  const keySecret = settings.RZP_KEY_SECRET;
  const maxQty = Number(settings.MAX_QTY_PER_ORDER || 5);

  // Extract form params
  const event_id = params.event_id;
  const qty = Math.min(maxQty, Math.max(1, Number(params.qty || 1)));
  const buyer_name = params.buyer_name || '';
  const buyer_email = params.buyer_email || '';
  const buyer_phone = params.buyer_phone || '';

  // Guests array: guest1_name, guest1_email, guest1_phone... up to qty
  const guests = [];
  for (let i = 1; i <= qty; i++){
    guests.push({
      name: params[`guest${i}_name`] || (i === 1 ? buyer_name : ''),
      email: params[`guest${i}_email`] || (i === 1 ? buyer_email : ''),
      phone: params[`guest${i}_phone`] || (i === 1 ? buyer_phone : ''),
    });
  }

  const ev = findEventRowById(event_id);
  if (!ev) return { ok:false, error:'Invalid event_id' };

  const rowVals = getSheet(SHEET_EVENTS).getRange(ev.row, 1, 1, 8).getValues()[0]; // A:H
  const isActive = rowVals[6] === true; // is_active (G)
  const price = Number(rowVals[4] || 0);
  const maxSeats = Number(rowVals[5] || 0);

  // Hard stop if inactive
  if (!isActive) return { ok:false, error:'Event not active' };

  // Pre-calc tentative availability (definitive check happens on webhook under lock)
  const confirmed = countConfirmedSeats(event_id);
  const tentativeLeft = Math.max(0, maxSeats - confirmed);
  if (tentativeLeft <= 0) return { ok:false, error:'Sold out' };

  // Create client token & pre-save booking (PENDING)
  const client_token = Utilities.getUuid().replace(/-/g,'');
  const amountInPaise = Math.round(price * qty * 100);

  const bookingId = upsertBookingAndGuests({
    event_id, qty, buyer_name, buyer_email,
    guests, client_token,
    amount_inr: price * qty,
    status: 'PENDING'
  });

  // Create Razorpay order
  const orderPayload = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: client_token,
    notes: { client_token, event_id, qty: String(qty), booking_id: bookingId },
    payment_capture: 1
  };

  const resp = UrlFetchApp.fetch(RZP_ORDERS_URL, {
    method: 'post',
    headers: Object.assign({'Content-Type':'application/json'}, basicAuthHeader(keyId, keySecret)),
    payload: JSON.stringify(orderPayload),
    muteHttpExceptions: true,
  });

  const code = resp.getResponseCode();
  const body = JSON.parse(resp.getContentText() || '{}');
  if (code >= 200 && code < 300 && body && body.id) {
    // Save order_id back
    upsertBookingAndGuests({
      event_id, qty, buyer_name, buyer_email,
      guests, client_token, order_id: body.id
    });
    return {
      ok:true,
      order_id: body.id,
      key_id: keyId,
      amount: amountInPaise,
      buyer_name, buyer_email, buyer_phone,
      client_token, booking_id: bookingId
    };
  } else {
    return { ok:false, error: (body && body.error && body.error.description) || 'Order create failed' };
  }
}

/***** ACTION: webhook (Razorpay → Apps Script) *****/
function handleRazorpayWebhook(e) {
  const settings = getSettings();
  const signature = e.headers['X-Razorpay-Signature'] || e.headers['x-razorpay-signature'];
  const body = e.postData.contents;

  // Verify signature
  const hmac = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, body, settings.WEBHOOK_SECRET);
  const expected = Utilities.base64Encode(hmac);
  if (expected !== signature) {
    return jsonOutput({ ok:false, error:'Invalid signature' });
  }

  const payload = JSON.parse(body);
  const event = payload.event || '';
  // We’ll handle payment.captured as the confirmation trigger
  if (event !== 'payment.captured') return jsonOutput({ ok:true, ignored:true });

  const payment = payload.payload && payload.payload.payment && payload.payload.payment.entity;
  if (!payment) return jsonOutput({ ok:true, ignored:true });

  const paymentId = payment.id;
  const orderId = payment.order_id;
  const notes = payment.notes || {};
  const client_token = notes.client_token;
  const event_id = notes.event_id;
  const qty = Number(notes.qty || 1);

  // Lock for atomic seat check
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ev = findEventRowById(event_id);
    if (!ev) return jsonOutput({ ok:false, error:'Invalid event in webhook' });
    const evSh = getSheet(SHEET_EVENTS);
    const vals = evSh.getRange(ev.row, 1, 1, 8).getValues()[0]; // A:H
    const price = Number(vals[4] || 0);
    const maxSeats = Number(vals[5] || 0);
    const isActive = vals[6] === true;

    if (!isActive) {
      // inactive -> refund
      doRefundAndMark(event_id, client_token, paymentId, orderId, price, qty, 'Event inactive');
      return jsonOutput({ ok:true, refunded:true });
    }

    const confirmed = countConfirmedSeats(event_id);
    const seatsLeft = Math.max(0, maxSeats - confirmed);

    if (seatsLeft >= qty) {
      // Confirm booking
      markBookingConfirmed(client_token, paymentId, orderId);
      sendConfirmationEmails(client_token, event_id);
      return jsonOutput({ ok:true, confirmed:true });
    } else {
      // Auto refund backup
      doRefundAndMark(event_id, client_token, paymentId, orderId, price, qty, 'Sold out');
      return jsonOutput({ ok:true, refunded:true });
    }
  } finally {
    lock.releaseLock();
  }
}

function markBookingConfirmed(client_token, paymentId, orderId) {
  const bkSh = getSheet(SHEET_BOOKINGS);
  const lastRow = bkSh.getLastRow();
  if (lastRow < 2) return;

  const all = bkSh.getRange(2, 1, lastRow - 1, 12).getValues();
  for (let i = 0; i < all.length; i++){
    if (all[i][1] === client_token) {
      const row = i + 2;
      bkSh.getRange(row, 6).setValue('CONFIRMED'); // F
      bkSh.getRange(row, 8).setValue(paymentId);   // H
      bkSh.getRange(row, 9).setValue(orderId);     // I
      bkSh.getRange(row, 12).setValue(nowISO());   // L
      break;
    }
  }
}

function doRefundAndMark(event_id, client_token, paymentId, orderId, price, qty, reason) {
  const settings = getSettings();
  const keyId = settings.RZP_KEY_ID, keySecret = settings.RZP_KEY_SECRET;
  try {
    UrlFetchApp.fetch(RZP_REFUND_URL(paymentId), {
      method: 'post',
      headers: Object.assign({'Content-Type':'application/json'}, basicAuthHeader(keyId, keySecret)),
      payload: JSON.stringify({ speed: 'optimum', notes: { reason, client_token, event_id, qty: String(qty) } }),
      muteHttpExceptions: true,
    });
  } catch(e) { /* swallow; we still mark */ }
  // Mark refunded
  const bkSh = getSheet(SHEET_BOOKINGS);
  const lastRow = bkSh.getLastRow();
  if (lastRow >= 2) {
    const all = bkSh.getRange(2, 1, lastRow - 1, 12).getValues();
    for (let i = 0; i < all.length; i++){
      if (all[i][1] === client_token) {
        const row = i + 2;
        bkSh.getRange(row, 6).setValue('REFUNDED'); // F
        bkSh.getRange(row, 8).setValue(paymentId);  // H
        bkSh.getRange(row, 9).setValue(orderId);    // I
        bkSh.getRange(row, 12).setValue(nowISO());  // L
        break;
      }
    }
  }
  sendRefundEmail(client_token, event_id, reason);
}

/***** ACTION: publicEvents (for frontend to show seats left) *****/
function handlePublicEvents() {
  const evSh = getSheet(SHEET_EVENTS);
  const lastRow = evSh.getLastRow();
  if (lastRow < 2) {
    return jsonOutput({ ok:true, events: [] });
  }
  const rows = evSh.getRange(2, 1, lastRow - 1, 8).getValues();
  const out = rows.map(r => {
    const event_id = r[0], name = r[1], date_iso = r[2], venue = r[3], price = Number(r[4]||0),
          maxSeats = Number(r[5]||0), isActive = r[6] === true;
    const confirmed = countConfirmedSeats(event_id);
    const seats_left = Math.max(0, maxSeats - confirmed);
    return { event_id, name, date_iso, venue, price_inr: price, max_seats: maxSeats, seats_left, is_active: isActive };
  });
  return jsonOutput({ ok:true, events: out });
}

/***** EMAILS *****/
function sendConfirmationEmails(client_token, event_id) {
  const settings = getSettings();
  const from = settings.FROM_EMAIL || Session.getActiveUser().getEmail();

  const ev = findEventRowById(event_id);
  if (!ev) return;
  const evData = getSheet(SHEET_EVENTS).getRange(ev.row, 1, 1, 8).getValues()[0];
  const eventName = evData[1], eventDate = evData[2], venue = evData[3];

  const bkSh = getSheet(SHEET_BOOKINGS);
  const gSh = getSheet(SHEET_GUESTS);

  const lastRowBk = bkSh.getLastRow();
  if (lastRowBk < 2) return;

  const bAll = bkSh.getRange(2, 1, lastRowBk - 1, 12).getValues();
  let bookingId = null;
  for (let i = 0; i < bAll.length; i++){ if (bAll[i][1] === client_token){ bookingId = bAll[i][0]; break; } }
  if (!bookingId) return;

  const lastRowG = gSh.getLastRow();
  if (lastRowG < 2) return;
  const gAll = gSh.getRange(2, 1, lastRowG - 1, 5).getValues();
  const guests = gAll.filter(r => r[0] === bookingId);

  guests.forEach(g => {
    const name = g[2], email = g[3];
    if (!email) return;
    const subject = settings.EMAIL_SUBJECT || `Your seat is confirmed: ${eventName}`;
    const body =
`Hi ${name || 'Guest'},

Your seat is confirmed for ${eventName}.
Date & Time: ${eventDate}
Venue: ${venue}

See you there!
`;
    GmailApp.sendEmail(email, subject, body, { name: 'Bookings', replyTo: from, from: from });
  });
}

function sendRefundEmail(client_token, event_id, reason) {
  const settings = getSettings();
  const from = settings.FROM_EMAIL || Session.getActiveUser().getEmail();

  const ev = findEventRowById(event_id);
  if (!ev) return;
  const evData = getSheet(SHEET_EVENTS).getRange(ev.row, 1, 1, 8).getValues()[0];
  const eventName = evData[1];

  const bkSh = getSheet(SHEET_BOOKINGS);
  const lastRowBk = bkSh.getLastRow();
  if (lastRowBk < 2) return;
  const bAll = bkSh.getRange(2, 1, lastRowBk - 1, 12).getValues();

  let row = null;
  for (let i = 0; i < bAll.length; i++){ if (bAll[i][1] === client_token){ row = bAll[i]; break; } }
  if (!row) return;
  const buyerEmail = row[4];

  if (buyerEmail) {
    GmailApp.sendEmail(
      buyerEmail,
      `Refund processed for ${eventName}`,
      `We could not allocate seats due to limited availability. Your payment has been refunded.\nReason: ${reason}\n\nSorry for the inconvenience.`
    );
  }
}

/***** ROUTER: Publish one web app URL ******/
function doGet(e){ return route(e, 'GET'); }
function doPost(e){ return route(e, 'POST'); }

function route(e, method){
  const path = (e.parameter && e.parameter.action) || '';
  if (method === 'POST' && (!path) && e.postData && e.postData.type === 'application/json') {
    // Webhook from Razorpay (no ?action=)
    return handleRazorpayWebhook(e);
  }
  if (path === 'createOrder') return jsonOutput(handleCreateOrder(e.parameter || {}));
  if (path === 'publicEvents') return handlePublicEvents();
  return jsonOutput({ ok:false, error:'Unknown route' });
}
