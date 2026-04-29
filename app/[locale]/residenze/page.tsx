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

const LABELS: Record<string, { title: string; subtitle: string }> = {
  it: { title: 'Le nostre Residenze', subtitle: 'Scegli il tuo appartamento e prenota direttamente con noi' },
  en: { title: 'Our Residences',     subtitle: 'Choose your apartment and book directly with us' },
  de: { title: 'Unsere Residenzen',  subtitle: 'Wählen Sie Ihre Unterkunft und buchen Sie direkt bei uns' },
  pl: { title: 'Nasze Rezydencje',   subtitle: 'Wybierz apartament i zarezerwuj bezpośrednio u nas' },
};

const SECTION_ICON: Record<number, string> = {
  46487: 'bi-tree-fill',
  46871: 'bi-umbrella-fill',
};

export default async function ResidenzePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = LABELS[locale] ?? LABELS.it;
  const covers = await getCovers();

  return (
    <main className="page-container page-top pb-4">

      <div className="text-center mb-5 px-2">
        <h1 className="display-5 fw-bold text-primary mb-2">{t.title}</h1>
        <p className="fs-5 text-secondary mb-0">{t.subtitle}</p>
      </div>

      {PROPERTIES.map((property, idx) => (
        <section key={property.propertyId} className={idx < PROPERTIES.length - 1 ? 'mb-5' : ''}>
          <header className={`residenze-section__header residenze-section__header--p${property.propertyId}`}>
            <div className="residenze-section__icon-wrap">
              <i className={`bi ${SECTION_ICON[property.propertyId] ?? 'bi-house-fill'}`} aria-hidden="true" />
            </div>
            <div className="residenze-section__text">
              <h2 className="residenze-section__title">{property.name}</h2>
              <p className="residenze-section__subtitle">
                {property.distanceLabel[locale] ?? property.distanceLabel.it}
              </p>
            </div>
          </header>
          <div className="residenze-section__grid">
            {property.rooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                locale={locale}
                coverUrl={covers[room.cloudinaryFolder] ?? null}
              />
            ))}
          </div>
        </section>
      ))}

    </main>
  );
}
