import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { getTranslations } from '@/lib/i18n';
import Image from 'next/image';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
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
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <a href={`/${locale}`} style={styles.logoLink}>
          <Image
            src="/logo.png"
            alt="LivingApple"
            height={40}
            width={160}
            style={{ objectFit: 'contain' }}
            priority
          />
        </a>
        <nav style={styles.nav}>
          <a href={`/${locale}`} style={styles.navLink}>{t.nav.home}</a>
          <a href={`/${locale}/residenze`} style={styles.navLink}>{t.nav.residences}</a>
          <a href={`/${locale}/dove-siamo`} style={styles.navLink}>{t.nav.location}</a>
          <a href={`/${locale}/contatti`} style={styles.navLink}>{t.nav.contact}</a>
        </nav>
        <a href={`/${locale}/prenota`} style={styles.cta}>
          {t.nav.book}
        </a>
      </div>
    </header>

    <main>{children}</main>

    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <p style={styles.footerCompany}>{t.footer.company}</p>
        <p style={styles.footerText}>{t.footer.address}</p>
        <p style={styles.footerText}>
          WhatsApp: {t.footer.whatsapp} &nbsp;|&nbsp; Tel: {t.footer.phone}
        </p>
        <p style={styles.footerText}>
          {t.footer.vat} &nbsp;|&nbsp; {t.footer.rea}
        </p>
        <div style={styles.footerLinks}>
          <a href={`/${locale}/privacy`} style={styles.footerLink}>{t.footer.privacy}</a>
          <a href={`/${locale}/condizioni`} style={styles.footerLink}>{t.footer.terms}</a>
          <a href={`/${locale}/cookie`} style={styles.footerLink}>{t.footer.cookies}</a>
        </div>
      </div>
    </footer>
  </>
);
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 1.5rem',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  logoLink: {
    marginRight: 'auto',
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '1.5rem',
  },
  navLink: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '0.95rem',
  },
  cta: {
    backgroundColor: '#1E73BE',
    color: '#fff',
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  footer: {
    backgroundColor: '#1a1a1a',
    color: '#d1d5db',
    padding: '2.5rem 1.5rem',
    marginTop: '4rem',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  footerCompany: {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#fff',
    marginBottom: '0.5rem',
  },
  footerText: {
    fontSize: '0.85rem',
    marginBottom: '0.25rem',
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  footerLink: {
    color: '#9ca3af',
    fontSize: '0.8rem',
    textDecoration: 'none',
  },
};
