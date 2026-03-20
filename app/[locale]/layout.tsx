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
  const t = await getTranslations(locale);
  return {
    title: t.meta.home_title,
    description: t.meta.home_description,
    icons: { icon: '/logo.png' },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = await getTranslations(locale);

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

      <main style={{ paddingBottom: '80px', overflowX: 'hidden' }}>{children}</main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{
        backgroundColor: '#111',
        color: '#9ca3af',
        padding: '3rem 1.5rem 5.5rem', // extra bottom per bottone fisso
        marginTop: '4rem',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
        }}>

          {/* Griglia 3 colonne desktop, 1 mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid #2a2a2a',
          }}>

            {/* Colonna 1 — Brand + contatti */}
            <div>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', margin: '0 0 0.75rem' }}>
                {t.footer.company}
              </p>
              <p style={fLine}>{t.footer.address}</p>
              <p style={fLine}>WhatsApp: <a href={`https://wa.me/${t.footer.whatsapp.replace(/\D/g,'')}`} style={fLink}>{t.footer.whatsapp}</a></p>
              <p style={fLine}>Tel: <a href={`tel:${t.footer.phone}`} style={fLink}>{t.footer.phone}</a></p>
            </div>

            {/* Colonna 2 — Fiscale e legale */}
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>
                Dati legali
              </p>
              <p style={fLine}>{t.footer.vat}</p>
              <p style={fLine}>{t.footer.rea}</p>
              <p style={fLine}>CIN {CIN}</p>
              <p style={fLine}>CIR {CIR}</p>
            </div>

            {/* Colonna 3 — Link navigazione (nascosta su mobile — sono nell'hamburger) */}
            <div className="footer-links-col">
              <p style={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>
                Link utili
              </p>
              {[
                { href: `/${locale}/contatti`,        label: t.footer.contact },
                { href: `/${locale}/condizioni`,      label: t.footer.terms },
                { href: `/${locale}/privacy`,         label: t.footer.privacy },
                { href: `/${locale}/trattamento-dati`,label: t.footer.data },
              ].map(({ href, label }) => (
                <a key={href} href={href} style={{ ...fLink, display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                  {label}
                </a>
              ))}
            </div>

          </div>

          {/* Bottom bar */}
          <p style={{ margin: '1.25rem 0 0', fontSize: '0.78rem', color: '#4b5563', textAlign: 'center' }}>
            © {new Date().getFullYear()} {t.footer.company} · All rights reserved
          </p>

        </div>
      </footer>

      <style>{`
        @media (max-width: 680px) {
          .footer-links-col { display: none !important; }
        }
      `}</style>
    </>
  );
}

const fLine: React.CSSProperties = { fontSize: '0.85rem', margin: '0 0 0.35rem', color: '#9ca3af', lineHeight: 1.5 };
const fLink: React.CSSProperties = { color: '#9ca3af', textDecoration: 'none' };
