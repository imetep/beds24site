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
    <main className="page-container py-4">

      <div className="text-center mb-5 px-2">
        <h1 className="display-5 fw-bold text-primary mb-2">{t.title}</h1>
        <p className="fs-5 text-secondary mb-0">{t.subtitle}</p>
      </div>

      <section className="mb-5">
        <h2 className="fs-5 fw-bold text-secondary pb-2 mb-3 border-bottom px-2" style={{ borderBottomWidth: 2 }}>
          🌿 {t.natura}
        </h2>
        <div
          className="d-grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}
        >
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
        <h2 className="fs-5 fw-bold text-secondary pb-2 mb-3 border-bottom px-2" style={{ borderBottomWidth: 2 }}>
          🏖️ {t.mare}
        </h2>
        <div
          className="d-grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}
        >
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
