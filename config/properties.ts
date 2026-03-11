import { Locale } from './i18n';

export type Property = {
  id: string;
  beds24Id: number;
  slug: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  coverImage: string;
};

export const properties: Property[] = [
  {
    id: 'living-apple-1',
    beds24Id: 0, // da sostituire con il propertyId reale di Beds24
    slug: {
      it: 'residenza-mele',
      en: 'apple-residence',
      de: 'apfel-residenz',
      pl: 'rezydencja-jablko',
    },
    title: {
      it: 'Residenza Mele',
      en: 'Apple Residence',
      de: 'Apfel Residenz',
      pl: 'Rezydencja Jabłko',
    },
    description: {
      it: 'Splendida residenza nel cuore dell\'Alto Adige.',
      en: 'Beautiful residence in the heart of South Tyrol.',
      de: 'Wunderschöne Residenz im Herzen Südtirols.',
      pl: 'Piękna rezydencja w sercu Południowego Tyrolu.',
    },
    coverImage: '', // da sostituire con URL Cloudinary
  },
];