import { PROPERTIES } from '@/config/properties';
import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';
import RoomCard from '@/components/residenze/RoomCard';
import { getCovers } from '@/lib/cloudinary-covers';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const LABELS: Record<string, Record<string, string>> = {
  it: {
    title: 'Le nostre Residenze',
    subtitle: 'Scegli il tuo appartamento e prenota direttamente con noi',
    natura: 'LivingApple · Immerso nella natura · 1.5km dal mare',
    mare: 'LivingApple Beach · Vicino al mare · 250m dalla spiaggia',
  },
  en: {
    title: 'Our Residences',
    subtitle: 'Choose your apartment and book directly with us',
    natura: 'LivingApple · Surrounded by nature · 1.5km from the sea',
    mare: 'LivingApple Beach · Near the sea · 250m from the beach',
  },
  de: {
    title: 'Unsere Residenzen',
    subtitle: 'Wählen Sie Ihre Unterkunft und buchen Sie direkt bei uns',
    natura: 'LivingApple · In der Natur · 1,5km vom Meer',
    mare: 'LivingApple Beach · In Meeresnähe · 250m vom Strand',
  },
  pl: {
    title: 'Nasze Rezydencje',
    subtitle: 'Wybierz apartament i zarezerwuj bezpośrednio u nas',
    natura: 'LivingApple · Wśród natury · 1,5km od morza',
    mare: 'LivingApple Beach · Blisko morza · 250m od plaży',
  },
};

export default async function ResidenzePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = LABELS[locale] ?? LABELS.it;
  const covers = await getCovers();

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(0px,2vw,16px)' }}>

      <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 12px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1E73BE', marginBottom: 8 }}>
          {t.title}
        </h1>
        <p style={{ fontSize: 16, color: '#666' }}>{t.subtitle}</p>
      </div>

      <section style={{ marginBottom: 56 }}>
        <h2 style={sectionTitleStyle}>🌿 {t.natura}</h2>
        <div style={gridStyle}>
          {PROPERTIES[0].rooms.map((room) => (
            <RoomCard
              key={room.roomId}
              room={room}
              locale={locale}
              coverUrl={covers[room.cloudinaryFolder] ?? null}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 style={sectionTitleStyle}>🏖️ {t.mare}</h2>
        <div style={gridStyle}>
          {PROPERTIES[1].rooms.map((room) => (
            <RoomCard
              key={room.roomId}
              room={room}
              locale={locale}
              coverUrl={covers[room.cloudinaryFolder] ?? null}
            />
          ))}
        </div>
      </section>

    </main>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, color: '#444',
  marginBottom: 20, paddingBottom: 10,
  paddingLeft: 12, paddingRight: 12,
  borderBottom: '2px solid #f0f0f0',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
  gap: 20,
};
