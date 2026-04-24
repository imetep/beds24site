'use client';
import { useState } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

// ─── Tipi ─────────────────────────────────────────────────────────────────────
interface FaqItemData {
  q: string;
  a: string;
  link?: { label: string; href: string };
}
interface FaqCategory { icon: string; label: string; items: FaqItemData[]; }

// ─── Componente accordion singolo ────────────────────────────────────────────
function FaqItem({ item }: { item: FaqItemData }) {
  const [open, setOpen] = useState(false);
  const lines = item.a.split('\n');

  return (
    <div style={{ borderBottom: '1px solid #f0f4f8' }}>
      {/* Domanda */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="btn w-100 d-flex align-items-center justify-content-between gap-3 text-start px-3 py-3 border-0 rounded-0"
        style={{
          background: open ? '#fffbf2' : '#fff',
          minHeight: 58,
          transition: 'background 180ms',
          borderLeft: open ? '4px solid #FCAF1A' : '4px solid transparent',
        }}
      >
        <span
          className="flex-fill fw-semibold"
          style={{
            fontSize: 15,
            color: open ? 'var(--color-primary)' : '#1a1a2e',
            lineHeight: 1.4,
          }}
        >
          {item.q}
        </span>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: 28, height: 28,
            background: open ? '#FCAF1A' : '#f0f4f8',
            transition: 'background 180ms',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={open ? '#fff' : '#6b7280'} strokeWidth="2.5"
            style={{ transition: 'transform 220ms ease', transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* Risposta */}
      {open && (
        <div
          className="pb-3"
          style={{
            paddingLeft: 24, paddingRight: 20,
            fontSize: 14,
            color: '#374151',
            lineHeight: 1.7,
            background: '#fffbf2',
            borderLeft: '4px solid #FCAF1A',
          }}
        >
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
          {item.link && (
            <a
              href={item.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="d-inline-flex align-items-center gap-1 mt-3 text-white fw-semibold text-decoration-none rounded-pill"
              style={{
                fontSize: 13,
                background: 'var(--color-primary)',
                padding: '6px 14px',
              }}
            >
              {item.link.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Canali contatto ──────────────────────────────────────────────────────────
type ContactT = {
  contactTitle: string; contactSubtitle: string;
  wa: string; waSub: string;
  tel: string; telSub: string;
  mail: string; mailSub: string;
};

function ContactChannels({ t }: { t: ContactT }) {
  const WA_NUMBER = '393283131500';
  const PHONE     = 'tel:+390771062003';
  const EMAIL     = 'mailto:contattolivingapple@gmail.com';

  const channels = [
    {
      href: `https://wa.me/${WA_NUMBER}`,
      accent: '#25D366',
      label: t.wa, sub: t.waSub,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      href: PHONE,
      accent: 'var(--color-primary)',
      label: t.tel, sub: t.telSub,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.72A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.91a16 16 0 006.18 6.18l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      ),
    },
    {
      href: EMAIL,
      accent: '#6b7280',
      label: t.mail, sub: t.mailSub,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      className="bg-white border overflow-hidden shadow-sm"
      style={{ borderRadius: 16 }}
    >
      {/* Header sezione */}
      <div className="d-flex align-items-center gap-2 px-3 py-3" style={{ background: 'var(--color-primary)' }}>
        <span style={{ fontSize: 18 }}>💬</span>
        <div>
          <p className="m-0 fw-bold text-white" style={{ fontSize: 14 }}>
            {t.contactTitle}
          </p>
          <p className="mb-0" style={{ marginTop: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            {t.contactSubtitle}
          </p>
        </div>
      </div>

      {channels.map((ch, i) => (
        <a
          key={ch.href}
          href={ch.href}
          target={ch.href.startsWith('http') ? '_blank' : undefined}
          rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className={`d-flex align-items-center gap-3 px-3 py-3 text-decoration-none bg-white${i < channels.length - 1 ? ' border-bottom' : ''}`}
          style={{ minHeight: 68 }}
        >
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: 46, height: 46,
              borderRadius: 13,
              background: ch.accent,
              boxShadow: `0 4px 12px ${ch.accent}40`,
            }}
          >
            {ch.icon}
          </div>
          <div className="flex-fill">
            <p className="m-0 fw-bold text-dark" style={{ fontSize: 16 }}>{ch.label}</p>
            <p className="text-muted mb-0" style={{ marginTop: 2, fontSize: 12 }}>{ch.sub}</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </a>
      ))}
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
interface Props { locale: Locale; bookHref: string; }

export default function ContattiClient({ locale, bookHref }: Props) {
  const t = getTranslations(locale).components.contatti;
  const faqData: FaqCategory[] = t.faq;

  return (
    <div className="page-container pb-4 min-vh-100" style={{ background: '#f8fafc' }}>

      {/* ── Hero con sfondo brand ─────────────────────────────────────────── */}
      <div
        className="px-3 pt-4 pb-4"
        style={{ background: 'linear-gradient(135deg, #006CB7 0%, #1557a0 100%)' }}
      >
        <h1
          className="fw-bolder text-white mb-2"
          style={{ fontSize: 30, lineHeight: 1.15 }}
        >
          {t.pageTitle}
        </h1>
        <p className="m-0" style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
          {t.pageSubtitle}
        </p>
      </div>

      {/* ── Contenuto principale ─────────────────────────────────────────── */}
      <div className="px-2 pt-3">

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <div className="d-flex flex-column gap-3 mb-3">
          {faqData.map((cat, ci) => (
            <div
              key={ci}
              className="bg-white overflow-hidden shadow-sm border"
              style={{ borderRadius: 16 }}
            >
              {/* Header categoria — blu pieno */}
              <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ background: 'var(--color-primary)' }}>
                <i className={`bi ${cat.icon} text-white`} style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true" />
                <span
                  className="fw-bold text-white"
                  style={{ fontSize: 14, letterSpacing: '0.01em' }}
                >
                  {cat.label}
                </span>
              </div>

              {/* Domande */}
              {cat.items.map((item, ii) => (
                <FaqItem key={ii} item={item} />
              ))}
            </div>
          ))}
        </div>

        {/* ── Canali contatto ──────────────────────────────────────────────── */}
        <div className="mb-3">
          <ContactChannels t={t} />
        </div>

        {/* ── Banner prenotazione sicura ────────────────────────────────────── */}
        <div className="mb-3">
          <a
            href={`/${locale}/prenotazione-sicura`}
            className="d-flex align-items-center justify-content-between gap-2 bg-white border text-decoration-none shadow-sm px-3 py-3"
            style={{ borderRadius: 14 }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF5FC' }}
              >
                <span style={{ fontSize: 20 }}>🔍</span>
              </div>
              <span className="fw-medium" style={{ fontSize: 14, color: '#374151', lineHeight: 1.4 }}>
                {t.safeBannerText}
              </span>
            </div>
            <span
              className="fw-bold text-nowrap flex-shrink-0"
              style={{ fontSize: 13, color: 'var(--color-primary)' }}
            >
              {t.safeBannerBtn}
            </span>
          </a>
        </div>

        {/* ── Banner prenota ────────────────────────────────────────────────── */}
        <div
          className="d-flex align-items-center justify-content-between gap-3 p-3"
          style={{
            background: 'linear-gradient(135deg, #FCAF1A 0%, #f59e0b 100%)',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(252,175,26,0.3)',
          }}
        >
          <p className="m-0 fw-semibold text-dark" style={{ fontSize: 15, lineHeight: 1.4 }}>
            {t.bookBanner}
          </p>
          <a
            href={bookHref}
            className="fw-bold text-decoration-none text-nowrap flex-shrink-0"
            style={{
              background: '#111',
              color: '#FCAF1A',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 14,
            }}
          >
            {t.bookBtn}
          </a>
        </div>

      </div>
    </div>
  );
}
