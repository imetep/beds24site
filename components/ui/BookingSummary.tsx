/**
 * BookingSummary — riepilogo persistente della prenotazione.
 *
 * Usato nella sidebar dei wizard (prenota, self-checkin) e potenzialmente
 * nel portale guest post-booking.
 *
 * Componente presentazionale puro: riceve tutto come props, nessuna
 * dipendenza da store/i18n interno. Il chiamante è responsabile di
 * estrarre i dati dallo store e passare labels tradotte.
 *
 * Spec: docs/ux/wizard-layout.md §6 (D2 ratificata — zero marketing,
 * solo summary prenotazione con prezzo totale CON tasse sempre visibile).
 *
 * Principio guida: "è meglio perdere 2 prenotazioni che deludere 1 ospite"
 * (vedi docs/ux/wizard-layout.md). Qui mostriamo prezzo FINALE con tasse,
 * niente "da €X" fuorvianti, niente scarcity.
 */

import Button from './Button';

export interface BookingSummaryLabels {
  /** "La tua prenotazione" */
  title: string;
  /** "Check-in" */
  checkin: string;
  /** "Check-out" */
  checkout: string;
  /** "notti" (plurale) */
  nights: string;
  /** "notte" (singolare) */
  night: string;
  /** "Ospiti" */
  guests: string;
  /** "adulti" */
  adults: string;
  /** "bambini" */
  children: string;
  /** "Tariffa" */
  rate: string;
  /** "Totale" */
  total: string;
  /** "/notte" (suffisso prezzo per notte) */
  perNight: string;
  /** "Continua" */
  ctaContinue: string;
}

interface Props {
  labels: BookingSummaryLabels;
  /** Locale ISO: 'it' | 'en' | 'de' | 'pl' — per formattazione date */
  locale: string;
  /** Nome della residenza selezionata */
  roomName?: string;
  /** URL foto cover residenza (60×60px visualizzato) */
  roomCoverUrl?: string;
  /** Data check-in in formato YYYY-MM-DD */
  checkIn?: string;
  /** Data check-out in formato YYYY-MM-DD */
  checkOut?: string;
  /** Numero adulti */
  numAdults?: number;
  /** Numero bambini */
  numChildren?: number;
  /** Nome tariffa selezionata (es. "Non rimborsabile") */
  offerName?: string;
  /** Prezzo totale **con tasse incluse** (EUR). Mai "da €X". */
  totalPrice?: number;
  /** Prezzo per notte (EUR) — mostrato piccolo sotto al totale */
  pricePerNight?: number;
  /** Disabilita la CTA (step non completato, validazione) */
  ctaDisabled?: boolean;
  /** Callback click CTA. Se omesso, la CTA non viene renderizzata. */
  onCta?: () => void;
}

function calcNights(ci?: string, co?: string): number {
  if (!ci || !co) return 0;
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000);
}

function formatDate(ymd: string | undefined, locale: string): string {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const tag =
    locale === 'it' ? 'it-IT' :
    locale === 'de' ? 'de-DE' :
    locale === 'pl' ? 'pl-PL' :
    'en-GB';
  return dt.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BookingSummary({
  labels: l,
  locale,
  roomName,
  roomCoverUrl,
  checkIn,
  checkOut,
  numAdults,
  numChildren,
  offerName,
  totalPrice,
  pricePerNight,
  ctaDisabled,
  onCta,
}: Props) {
  const nights = calcNights(checkIn, checkOut);
  const hasRoom = !!roomName;
  const hasGuests = numAdults !== undefined && numAdults > 0;
  const hasPrice = totalPrice !== undefined && totalPrice > 0;

  return (
    <aside className="ui-booking-summary" aria-label={l.title}>
      <p className="ui-booking-summary-title">{l.title}</p>

      {hasRoom && (
        <div className="ui-booking-summary-room">
          {roomCoverUrl && (
            <img
              src={roomCoverUrl}
              alt=""
              className="ui-booking-summary-cover"
              loading="lazy"
            />
          )}
          <p className="ui-booking-summary-room-name">{roomName}</p>
        </div>
      )}

      {(hasRoom || checkIn || hasGuests) && <hr className="ui-booking-summary-sep" />}

      {checkIn && (
        <div className="ui-booking-summary-row">
          <span className="ui-booking-summary-row-label">{l.checkin}</span>
          <span className="ui-booking-summary-row-value">{formatDate(checkIn, locale)}</span>
        </div>
      )}
      {checkOut && (
        <div className="ui-booking-summary-row">
          <span className="ui-booking-summary-row-label">{l.checkout}</span>
          <span className="ui-booking-summary-row-value">{formatDate(checkOut, locale)}</span>
        </div>
      )}
      {nights > 0 && (
        <div className="ui-booking-summary-row">
          <span className="ui-booking-summary-row-label" />
          <span className="ui-booking-summary-row-value is-muted">
            {nights} {nights === 1 ? l.night : l.nights}
          </span>
        </div>
      )}
      {hasGuests && (
        <div className="ui-booking-summary-row">
          <span className="ui-booking-summary-row-label">{l.guests}</span>
          <span className="ui-booking-summary-row-value">
            {numAdults} {l.adults}
            {numChildren && numChildren > 0 ? `, ${numChildren} ${l.children}` : ''}
          </span>
        </div>
      )}

      {offerName && (
        <>
          <hr className="ui-booking-summary-sep" />
          <div className="ui-booking-summary-row">
            <span className="ui-booking-summary-row-label">{l.rate}</span>
            <span className="ui-booking-summary-row-value">{offerName}</span>
          </div>
        </>
      )}

      {hasPrice && (
        <>
          <div className="ui-booking-summary-price">
            <span className="ui-booking-summary-price-label">{l.total}</span>
            <span className="ui-booking-summary-price-total">{formatPrice(totalPrice)}</span>
          </div>
          {pricePerNight !== undefined && pricePerNight > 0 && (
            <p className="ui-booking-summary-price-pernight">
              {formatPrice(pricePerNight)}{l.perNight}
            </p>
          )}
        </>
      )}

      {onCta && (
        <div className="ui-booking-summary-cta-wrapper">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onCta}
            disabled={ctaDisabled}
          >
            {l.ctaContinue} →
          </Button>
        </div>
      )}
    </aside>
  );
}
