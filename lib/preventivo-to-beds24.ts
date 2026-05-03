/**
 * lib/preventivo-to-beds24.ts
 *
 * Conversione Preventivo → POST /bookings di Beds24.
 *
 * Beds24 API V2: POST https://beds24.com/api/v2/bookings con array di payload.
 * Headers: { token, 'Content-Type': 'application/json' }
 *
 * Note critiche:
 * - Beds24 normalmente calcola il prezzo dal listino. Per i preventivi (con
 *   sconti % personalizzati) passiamo il prezzo concordato in `price` e
 *   logghiamo dettaglio in `notes` per audit.
 * - Status 'confirmed' = booking attiva (calendario bloccato definitivamente).
 *   Solo per preventivi convertiti DOPO ricezione pagamento (bonifico verificato
 *   o cattura PayPal/Stripe avvenuta).
 */

import { getToken } from '@/lib/beds24-token';
import { computeTotals, type Preventivo, type PaymentMethod } from './preventivo-types';
import { getUpsellTexts } from '@/config/upsell-items';

const BEDS24_BASE = 'https://beds24.com/api/v2';

interface CreateBookingResult {
  bookId: number;
  raw: any;
}

/**
 * Crea una booking Beds24 a partire da un preventivo confermato.
 * Richiede: customerName + customerEmail già salvati nel preventivo.
 *
 * paymentMethod: usato solo in 'notes' per audit, NON cambia il payload.
 * receivedAmount: importo già incassato (acconto), in € — log in notes.
 */
export async function createBeds24BookingFromPreventivo(
  p: Preventivo,
  opts: { paymentMethod: PaymentMethod; receivedAmount: number }
): Promise<CreateBookingResult> {
  if (!p.customerEmail || !p.customerName) {
    throw new Error('preventivo senza dati cliente: impossibile creare booking');
  }

  const totals = computeTotals(p);
  const { firstName, lastName } = splitName(p.customerName);

  const notes = buildAuditNotes(p, totals.total, opts);

  const payload: Record<string, any> = {
    roomId:    p.roomId,
    arrival:   p.arrival,
    departure: p.departure,
    numAdult:  p.numAdults,
    numChild:  p.numChildren,
    firstName,
    lastName,
    email:     p.customerEmail,
    status:    'confirmed',
    // Tentativo override prezzo: Beds24 normalmente lo ricalcola, ma logghiamo
    // il valore atteso per check post-creazione
    price:     totals.total,
    notes,
  };

  if (p.customerPhone) payload.phone = p.customerPhone;

  const token = await getToken();
  const res = await fetch(`${BEDS24_BASE}/bookings`, {
    method: 'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body: JSON.stringify([payload]),
    cache: 'no-store',
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Beds24 POST /bookings fallita (${res.status}): ${rawText.slice(0, 300)}`);
  }

  const data = JSON.parse(rawText);
  // La risposta segue il pattern dell'API esistente in /api/bookings/route.ts
  const bookId = data?.[0]?.new?.id ?? data?.data?.[0]?.id ?? data?.bookId ?? data?.id;
  if (!bookId) {
    throw new Error(`Beds24 booking creata ma bookId non estratto: ${rawText.slice(0, 200)}`);
  }

  return { bookId: Number(bookId), raw: data };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const lastName = parts.pop()!;
  return { firstName: parts.join(' '), lastName };
}

function buildAuditNotes(
  p: Preventivo,
  totalExpected: number,
  opts: { paymentMethod: PaymentMethod; receivedAmount: number }
): string {
  const lines: string[] = [];
  lines.push(`Preventivo ${p.id.toUpperCase()}`);
  lines.push(`Totale concordato: €${totalExpected.toFixed(2)}`);
  lines.push(`Acconto incassato: €${opts.receivedAmount.toFixed(2)} via ${opts.paymentMethod}`);
  lines.push(`Saldo residuo al check-in: €${(totalExpected - opts.receivedAmount).toFixed(2)}`);

  if (p.baseDiscountPct > 0) {
    lines.push(`Sconto soggiorno: ${p.baseDiscountPct}% (-€${(p.basePrice * p.baseDiscountPct / 100).toFixed(2)})`);
  }

  if (p.upsells.length > 0) {
    lines.push('Servizi inclusi:');
    for (const u of p.upsells) {
      const name = getUpsellTexts(p.propertyId, u.index)?.name?.it ?? `Upsell #${u.index}`;
      const lineGross = u.unitPrice * u.qty;
      const lineNet = lineGross * (1 - u.discountPct / 100);
      lines.push(`  - ${name} ×${u.qty}: €${lineNet.toFixed(2)}${u.discountPct > 0 ? ` (sc. ${u.discountPct}%)` : ''}`);
    }
  }

  return lines.join('\n');
}
