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
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 16 }}>
        📍 {label}
      </h2>
      <div style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e8e8e8',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <iframe
          src={mapUrl}
          width="100%"
          height="380"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={name}
        />
      </div>
    </div>
  );
}
