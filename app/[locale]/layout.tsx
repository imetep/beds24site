import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { CIN, CIR } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import HeaderClient from '@/components/HeaderClient';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale);
  return {
    title: t.meta.home_title,
    description: t.meta.home_description,
    icons: { icon: '/logo.svg' },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getTranslations(locale);

  return (
    <>
      <HeaderClient
        locale={locale}
        nav={{
          home:       t.nav.home,
          residences: t.nav.residences,
          location:   t.nav.location,
          contact:    t.nav.contact,
          book:       t.nav.book,
        }}
        legal={{
          privacy: t.footer.privacy,
          terms:   t.footer.terms,
          data:    t.footer.data,
          contact: t.footer.contact,
        }}
      />

      <main className="site-main">{children}</main>

      {/* ── Footer (compact, mobile-first) ──────────────────────────────────── */}
      <footer className="site-footer">
        <div className="page-container site-footer__container">

          {/* Riga brand + indirizzo + © (inline desktop, stack mobile) */}
          <div className="site-footer__brand">
            <strong className="site-footer__company">{t.footer.company}</strong>
            <span className="site-footer__sep">·</span>
            <span className="site-footer__address">{t.footer.address}</span>
            <span className="site-footer__sep">·</span>
            <span className="site-footer__year">© {new Date().getFullYear()}</span>
          </div>

          {/* Link utili: inline su desktop, stack con frecce su mobile.
              WhatsApp + telefono volutamente fuori dal footer (vedi /contatti). */}
          <nav className="site-footer__links" aria-label="Footer">
            {[
              { href: `/${locale}/contatti`,            label: t.footer.contact },
              { href: `/${locale}/dove-siamo`,          label: t.footer.location },
              { href: `/${locale}/prenotazione-sicura`, label: t.footer.safe_booking },
              { href: `/${locale}/condizioni`,          label: t.footer.terms },
              { href: `/${locale}/privacy`,             label: t.footer.privacy },
              { href: `/${locale}/trattamento-dati`,    label: t.footer.data },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="site-footer__link">
                {label}
              </a>
            ))}
          </nav>

          {/* Info legali e fiscali — accordion native HTML <details> (SSR-safe, no JS) */}
          <details className="site-footer__legal">
            <summary className="site-footer__legal-summary">
              {t.footer.legal_data}
              <span className="site-footer__legal-chevron" aria-hidden="true">▾</span>
            </summary>
            <div className="site-footer__legal-content">
              <span>{t.footer.vat}</span>
              <span>{t.footer.rea}</span>
              <span>CIN {CIN}</span>
              <span>CIR {CIR}</span>
            </div>
          </details>

        </div>
      </footer>

    </>
  );
}
