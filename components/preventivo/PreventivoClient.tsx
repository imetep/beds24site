'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { PROPERTIES, type Room } from '@/config/properties';
import { UPSELL_TEXTS } from '@/config/upsell-items';
import { getTranslations } from '@/lib/i18n';
import { localeSlugs, type Locale } from '@/config/i18n';
import { computeTotals, type Preventivo, type PreventivoStatus } from '@/lib/preventivo-types';
import { fetchCoversCached } from '@/lib/cloudinary-client-cache';

interface Props {
  locale: Locale;
  preventivo: Omit<Preventivo, 'notes' | 'customerEmail' | 'customerName'>;
  /** Modalità anteprima admin: disabilita CTA "Blocca offerta", mostra banner */
  previewMode?: boolean;
}

function findRoom(roomId: number): Room | null {
  for (const p of PROPERTIES) {
    const r = p.rooms.find(r => r.roomId === roomId);
    if (r) return r;
  }
  return null;
}

function fmtEuro(n: number, locale: Locale): string {
  const localeMap: Record<Locale, string> = { it: 'it-IT', en: 'en-GB', de: 'de-DE', pl: 'pl-PL' };
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(ymd: string, locale: Locale): string {
  const localeMap: Record<Locale, string> = { it: 'it-IT', en: 'en-GB', de: 'de-DE', pl: 'pl-PL' };
  return new Date(ymd + 'T00:00:00').toLocaleDateString(localeMap[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(ms: number, locale: Locale): string {
  const localeMap: Record<Locale, string> = { it: 'it-IT', en: 'en-GB', de: 'de-DE', pl: 'pl-PL' };
  return new Date(ms).toLocaleString(localeMap[locale], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcNights(arrival: string, departure: string): number {
  return Math.round(
    (new Date(departure).getTime() - new Date(arrival).getTime()) / 86_400_000
  );
}

function fmtSubject(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
}

export default function PreventivoClient({ locale, preventivo, previewMode = false }: Props) {
  const router = useRouter();
  const t = getTranslations(locale).components.preventivoView;
  const room = findRoom(preventivo.roomId);
  const upsellTexts = UPSELL_TEXTS[preventivo.propertyId] ?? {};
  const totals = useMemo(() => computeTotals(preventivo as Preventivo), [preventivo]);
  const nights = calcNights(preventivo.arrival, preventivo.departure);

  // Countdown live ogni minuto (solo quando active, per refresh visivo della
  // riga "Valido fino a")
  const [, setTick] = useState(0);
  useEffect(() => {
    if (preventivo.status !== 'active') return;
    const id = setInterval(() => setTick(x => x + 1), 60_000);
    return () => clearInterval(id);
  }, [preventivo.status]);

  // Cover Cloudinary (stesso meccanismo di BookingSidebar)
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!room?.cloudinaryFolder) { setCoverUrl(null); return; }
    fetchCoversCached().then(covers => setCoverUrl(covers?.[room.cloudinaryFolder] ?? null));
  }, [room?.cloudinaryFolder]);

  if (!room) {
    return (
      <div className="page-container preventivo-view">
        <p className="text-center text-muted py-5">Camera non trovata.</p>
      </div>
    );
  }

  // ─── Stati non-active: mostra solo banner messaggio ────────────────────────
  if (preventivo.status === 'expired') {
    return <StatusOnlyView locale={locale} title={t.expiredTitle} text={t.expiredText} cta={t.expiredCta} icon="hourglass-split" />;
  }
  if (preventivo.status === 'cancelled') {
    return <StatusOnlyView locale={locale} title={t.cancelledTitle} text={t.cancelledText} cta={t.expiredCta} icon="x-circle" />;
  }
  if (preventivo.status === 'converted') {
    return (
      <div className="page-container preventivo-view">
        <div className="preventivo-view__status-card preventivo-view__status-card--ok">
          <Icon name="check-circle-fill" size={56} />
          <h1 className="preventivo-view__status-title">{t.convertedTitle}</h1>
          <p className="preventivo-view__status-text">{t.convertedText}</p>
          {preventivo.bookingId && (
            <p className="preventivo-view__status-booking">
              {t.convertedBookingLabel}: <strong>#{preventivo.bookingId}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Stato active: vista completa preventivo ───────────────────────────────
  const guestsLine =
    (preventivo.numAdults === 1 ? t.adult : fmtSubject(t.adults, { count: preventivo.numAdults })) +
    (preventivo.numChildren === 1 ? t.andChild :
      preventivo.numChildren > 1 ? fmtSubject(t.andChildren, { count: preventivo.numChildren }) : '');
  const nightsLabel = nights === 1 ? t.night : fmtSubject(t.nights, { count: nights });
  // coverUrl arriva async da Cloudinary; usiamo lo stesso URL sia per hero
  // che per la thumb piccola (CSS object-fit: cover gestisce il ritaglio).
  const photoUrl = coverUrl;
  const photoUrlSmall = coverUrl;
  const roomHref = `/${locale}/residenze/${room.slug}?from=preventivo`;
  const utenzeHref = `/${locale}/utenze`;
  const depositoHref = `/${locale}/deposito`;
  const pagaHref = `/${locale}/preventivo/${preventivo.id}/paga`;

  return (
    <div className="page-container preventivo-view">

      {previewMode && (
        <div className="preventivo-view__preview-banner">
          <Icon name="info-circle-fill" size={16} />
          Anteprima admin — il cliente vedrà esattamente questo. Il bottone "Blocca offerta" è disattivato in anteprima.
        </div>
      )}

      {/* Hero foto + titolo */}
      <Link href={roomHref} className="preventivo-view__hero">
        {photoUrl ? (
          <img src={photoUrl} alt={room.name} className="preventivo-view__hero-img" />
        ) : (
          <div className="preventivo-view__hero-img preventivo-view__hero-img--loading" />
        )}
        <span className="preventivo-view__hero-badge">{t.pageBadge}</span>
      </Link>

      <div className="preventivo-view__header">
        <h1 className="preventivo-view__title">{t.pageTitle}</h1>
        <p className="preventivo-view__subtitle">{t.pageSubtitle}</p>
        <p className="preventivo-view__validity">
          <Icon name="hourglass-split" size={16} />
          {t.validUntilLabel} <strong>{fmtDateTime(preventivo.expiresAt, locale)}</strong>
        </p>
      </div>

      {/* Date e ospiti */}
      <div className="preventivo-view__data-card">
        <div className="preventivo-view__data-row">
          <span className="preventivo-view__data-label">{t.datesLabel}</span>
          <div className="preventivo-view__data-value">
            <span>{fmtDate(preventivo.arrival, locale)} → {fmtDate(preventivo.departure, locale)}</span>
            <span className="preventivo-view__data-hint">{nightsLabel}</span>
          </div>
        </div>
        <div className="preventivo-view__data-row">
          <span className="preventivo-view__data-label">{t.guestsLabel}</span>
          <span className="preventivo-view__data-value">{guestsLine}</span>
        </div>
      </div>

      {/* Riepilogo prezzi */}
      <div className="preventivo-view__price-card">
        <div className="preventivo-view__price-row">
          <span>{t.stayLabel}</span>
          <span className="preventivo-view__price-value">
            {preventivo.baseDiscountPct > 0 && (
              <span className="preventivo-view__price-strike">{fmtEuro(totals.baseGross, locale)}</span>
            )}
            <strong>{fmtEuro(totals.baseNet, locale)}</strong>
          </span>
        </div>
        {preventivo.baseDiscountPct > 0 && (
          <div className="preventivo-view__price-row preventivo-view__price-row--discount">
            <span>↳ {fmtSubject(t.discountInline, { pct: preventivo.baseDiscountPct })}</span>
            <span>−{fmtEuro(totals.baseDiscount, locale)}</span>
          </div>
        )}

        {preventivo.upsells.length > 0 && (
          <>
            <p className="preventivo-view__extras-label">{t.extrasTitle}</p>
            {preventivo.upsells.map(u => {
              const lineGross = u.unitPrice * u.qty;
              const lineDiscount = lineGross * (u.discountPct / 100);
              const lineNet = lineGross - lineDiscount;
              const name = upsellTexts[u.index]?.name?.[locale] ?? `Upsell #${u.index}`;
              return (
                <div key={u.index}>
                  <div className="preventivo-view__price-row">
                    <span>{name} <span className="preventivo-view__qty">×{u.qty}</span></span>
                    <span className="preventivo-view__price-value">
                      {u.discountPct > 0 && (
                        <span className="preventivo-view__price-strike">{fmtEuro(lineGross, locale)}</span>
                      )}
                      <strong>{fmtEuro(lineNet, locale)}</strong>
                    </span>
                  </div>
                  {u.discountPct > 0 && (
                    <div className="preventivo-view__price-row preventivo-view__price-row--discount">
                      <span>↳ {fmtSubject(t.discountInline, { pct: u.discountPct })}</span>
                      <span>−{fmtEuro(lineDiscount, locale)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {totals.touristTax > 0 && (
          <div className="preventivo-view__price-row">
            <span>{t.touristTaxLabel}</span>
            <span className="preventivo-view__price-value">
              <strong>{fmtEuro(totals.touristTax, locale)}</strong>
            </span>
          </div>
        )}

        <hr className="preventivo-view__divider" />

        <div className="preventivo-view__total-row">
          <span>{t.totalLabel}</span>
          <span className="preventivo-view__total-amount">{fmtEuro(totals.total, locale)}</span>
        </div>

        {totals.totalDiscount > 0 && (
          <div className="preventivo-view__savings-badge">
            <Icon name="tag-fill" size={14} />
            {fmtSubject(t.savingsBadge, { amount: fmtEuro(totals.totalDiscount, locale) })}
          </div>
        )}
      </div>

      {/* Box: foto e dettagli casa */}
      <Link href={roomHref} className="preventivo-view__info-box">
        {photoUrlSmall ? (
          <img src={photoUrlSmall} alt={room.name} className="preventivo-view__info-img" />
        ) : (
          <div className="preventivo-view__info-img preventivo-view__hero-img--loading" />
        )}
        <div className="preventivo-view__info-text">
          <p className="preventivo-view__info-title">{t.linkPhotosTitle}</p>
          <p className="preventivo-view__info-desc">{t.linkPhotosDesc}</p>
        </div>
        <Icon name="arrow-up-right" size={20} />
      </Link>

      {/* Box: utenze (apre in nuova tab) */}
      <a href={utenzeHref} target="_blank" rel="noreferrer" className="preventivo-view__info-box preventivo-view__info-box--icon">
        <span className="preventivo-view__info-icon">
          <Icon name="lightning-fill" size={28} />
        </span>
        <div className="preventivo-view__info-text">
          <p className="preventivo-view__info-title">{t.linkUtenzeTitle}</p>
          <p className="preventivo-view__info-desc">{t.linkUtenzeDesc}</p>
        </div>
        <Icon name="arrow-up-right" size={20} />
      </a>

      {/* Box: deposito cauzionale (apre /deposito in nuova tab) */}
      {room.securityDeposit > 0 && (
        <a href={depositoHref} target="_blank" rel="noreferrer" className="preventivo-view__info-box preventivo-view__info-box--icon">
          <span className="preventivo-view__info-icon">
            <Icon name="shield-lock-fill" size={28} />
          </span>
          <div className="preventivo-view__info-text">
            <p className="preventivo-view__info-title">
              {fmtSubject(t.linkDepositTitle, { amount: fmtEuro(room.securityDeposit, locale) })}
            </p>
            <p className="preventivo-view__info-desc">{t.linkDepositDesc}</p>
          </div>
          <Icon name="arrow-up-right" size={20} />
        </a>
      )}

      {/* CTA Blocca offerta */}
      <button
        className="preventivo-view__cta"
        onClick={() => { if (!previewMode) router.push(pagaHref); }}
        disabled={previewMode}
        aria-disabled={previewMode}
      >
        <Icon name="lock-fill" size={20} />
        <span>
          <span className="preventivo-view__cta-main">{t.ctaBlock}</span>
          <span className="preventivo-view__cta-sub">{t.ctaBlockSub}</span>
        </span>
      </button>

    </div>
  );
}

// ─── Vista per stati non-active (expired/cancelled) ─────────────────────────

function StatusOnlyView({ locale, title, text, cta, icon }: {
  locale: Locale;
  title: string;
  text: string;
  cta: string;
  icon: 'hourglass-split' | 'x-circle';
}) {
  return (
    <div className="page-container preventivo-view">
      <div className="preventivo-view__status-card">
        <Icon name={icon} size={56} className="preventivo-view__status-icon" />
        <h1 className="preventivo-view__status-title">{title}</h1>
        <p className="preventivo-view__status-text">{text}</p>
        <Link href={`/${locale}/${localeSlugs.contact[locale]}`} className="preventivo-view__status-cta">{cta}</Link>
      </div>
    </div>
  );
}
