import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const LABELS: Record<string, Record<string, string>> = {
  it: {
    title: 'Contatti',
    phone_label: 'Chiamaci',
    email_label: 'E-Mail',
    address_label: 'Sede legale',
    address: 'Traversa C. Rosati, 8, 04028, Scauri di Minturno, Latina',
    livingapple_title: 'LivingApple',
    livingapple_address: 'Traversa Carmen Rosati, 04028 Scauri (LT)',
    livingapple_tel: 'Tel. +39 0771 187 57 44',
    beach_title: 'LivingApple Beach',
    beach_address: 'Via Pasquale Montanaro, 23, 04026 Minturno (LT)',
    beach_tel: 'Tel. +39 0771 187 56 84',
  },
  en: {
    title: 'Contact Us',
    phone_label: 'Call Us',
    email_label: 'E-Mail',
    address_label: 'Registered Office',
    address: 'Traversa C. Rosati, 8, 04028, Scauri di Minturno, Latina',
    livingapple_title: 'LivingApple',
    livingapple_address: 'Traversa Carmen Rosati, 04028 Scauri (LT)',
    livingapple_tel: 'Tel. +39 0771 187 57 44',
    beach_title: 'LivingApple Beach',
    beach_address: 'Via Pasquale Montanaro, 23, 04026 Minturno (LT)',
    beach_tel: 'Tel. +39 0771 187 56 84',
  },
  de: {
    title: 'Kontakt',
    phone_label: 'Anrufen',
    email_label: 'E-Mail',
    address_label: 'Firmensitz',
    address: 'Traversa C. Rosati, 8, 04028, Scauri di Minturno, Latina',
    livingapple_title: 'LivingApple',
    livingapple_address: 'Traversa Carmen Rosati, 04028 Scauri (LT)',
    livingapple_tel: 'Tel. +39 0771 187 57 44',
    beach_title: 'LivingApple Beach',
    beach_address: 'Via Pasquale Montanaro, 23, 04026 Minturno (LT)',
    beach_tel: 'Tel. +39 0771 187 56 84',
  },
  pl: {
    title: 'Kontakt',
    phone_label: 'Zadzwoń',
    email_label: 'E-Mail',
    address_label: 'Siedziba',
    address: 'Traversa C. Rosati, 8, 04028, Scauri di Minturno, Latina',
    livingapple_title: 'LivingApple',
    livingapple_address: 'Traversa Carmen Rosati, 04028 Scauri (LT)',
    livingapple_tel: 'Tel. +39 0771 187 57 44',
    beach_title: 'LivingApple Beach',
    beach_address: 'Via Pasquale Montanaro, 23, 04026 Minturno (LT)',
    beach_tel: 'Tel. +39 0771 187 56 84',
  },
};

export default async function ContattiPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = LABELS[locale] ?? LABELS.it;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem', color: '#1a1a1a' }}>
        {t.title}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div style={cardStyle}>
          <div style={cardLabelStyle}>{t.phone_label}</div>
          <div style={cardValueStyle}>+39 328 3131500</div>
        </div>
        <div style={cardStyle}>
          <div style={cardLabelStyle}>{t.email_label}</div>
          <a href="mailto:minturno@gmail.com" style={{ ...cardValueStyle, color: '#1E73BE', textDecoration: 'none' }}>
            minturno@gmail.com
          </a>
        </div>
        <div style={cardStyle}>
          <div style={cardLabelStyle}>{t.address_label}</div>
          <div style={cardValueStyle}>{t.address}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
        <div style={locationCardStyle}>
          <div style={locationTitleStyle}>{t.livingapple_title}</div>
          <div style={locationTextStyle}>{t.livingapple_address}</div>
          <div style={locationTextStyle}>{t.livingapple_tel}</div>
        </div>
        <div style={locationCardStyle}>
          <div style={locationTitleStyle}>{t.beach_title}</div>
          <div style={locationTextStyle}>{t.beach_address}</div>
          <div style={locationTextStyle}>{t.beach_tel}</div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#f9fafb',
  borderRadius: 12,
  padding: '1.5rem',
  border: '1px solid #e5e7eb',
};
const cardLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: '0.5rem',
};
const cardValueStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#1a1a1a',
};
const locationCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: '1.5rem',
  border: '2px solid #4A9FD4',
};
const locationTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  color: '#4A9FD4',
  marginBottom: '0.75rem',
};
const locationTextStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#374151',
  marginBottom: '0.25rem',
};
