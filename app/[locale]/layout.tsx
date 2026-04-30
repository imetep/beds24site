import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { CIN, CIR } from '@/config/properties';
import { getTranslations } from '@/lib/i18n';
import HeaderClient from '@/components/HeaderClient';
import ScrollToTop from '@/components/ScrollToTop';

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
      <ScrollToTop />
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

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="page-container">

          {/* Griglia 3 colonne desktop, 1 mobile */}
          <div className="site-footer__grid">

            {/* Colonna 1 — Brand + contatti */}
            <div>
              <p className="site-footer__company">{t.footer.company}</p>
              <p className="site-footer__line">{t.footer.address}</p>
              <p className="site-footer__line">WhatsApp: <a href={`https://wa.me/${t.footer.whatsapp.replace(/\D/g,'')}`} className="site-footer__link">{t.footer.whatsapp}</a></p>
              <p className="site-footer__line">Tel: <a href={`tel:${t.footer.phone}`} className="site-footer__link">{t.footer.phone}</a></p>
            </div>

            {/* Colonna 2 — Fiscale e legale */}
            <div>
              <p className="site-footer__col-title">{t.footer.legal_data}</p>
              <p className="site-footer__line">{t.footer.vat}</p>
              <p className="site-footer__line">{t.footer.rea}</p>
              <p className="site-footer__line">CIN {CIN}</p>
              <p className="site-footer__line">CIR {CIR}</p>
            </div>

            {/* Colonna 3 — Link navigazione (nascosta su mobile — sono nell'hamburger) */}
            <div className="footer-links-col">
              <p className="site-footer__col-title">{t.footer.useful_links}</p>
              {[
                { href: `/${locale}/contatti`,           label: t.footer.contact },
                { href: `/${locale}/dove-siamo`,         label: t.footer.location },
                { href: `/${locale}/prenotazione-sicura`,label: t.footer.safe_booking },
                { href: `/${locale}/condizioni`,         label: t.footer.terms },
                { href: `/${locale}/privacy`,            label: t.footer.privacy },
                { href: `/${locale}/trattamento-dati`,   label: t.footer.data },
              ].map(({ href, label }) => (
                <a key={href} href={href} className="site-footer__nav-link">
                  {label}
                </a>
              ))}
            </div>

          </div>

          {/* Bottom bar */}
          <p className="site-footer__bottom">
            © {new Date().getFullYear()} {t.footer.company} · {t.footer.all_rights_reserved}
          </p>

        </div>
      </footer>

    </>
  );
}
