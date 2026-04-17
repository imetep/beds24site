interface Props {
  latitude: number;
  longitude: number;
  name: string;
  locale?: string;
}

const LABELS: Record<string, string> = {
  it: 'Come arrivare',
  en: 'How to get there',
  de: 'Anfahrt',
  pl: 'Jak dojechać',
};

export default function PropertyMap({ latitude, longitude, name, locale = 'it' }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const label = LABELS[locale] ?? LABELS.it;

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
