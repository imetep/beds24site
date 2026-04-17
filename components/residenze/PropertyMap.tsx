import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
  locale?: string;
}

export default function PropertyMap({ latitude, longitude, name, locale = 'it' }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const t = getTranslations((locale as Locale));
  const label = t.components.propertyMap.label;

  if (!apiKey) return null;

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=15&language=${locale}`;

  return (
    <div className="mb-5">
      <h2 className="fs-4 fw-bold mb-3" style={{ color: '#222' }}>
        📍 {label}
      </h2>
      <div className="overflow-hidden border shadow-sm" style={{ borderRadius: 16 }}>
        <iframe
          src={mapUrl}
          width="100%"
          height="380"
          className="d-block border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={name}
        />
      </div>
    </div>
  );
}
