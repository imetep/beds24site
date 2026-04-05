'use client';

type Locale = 'it' | 'en' | 'de' | 'pl';

// ─── Traduzioni ────────────────────────────────────────────────────────────────
const T: Record<Locale, {
  hero_title: string;
  hero_sub: string;
  legal_note: string;
  // Sezione 1 — Quali animali
  s1_title: string;
  s1_items: string[];
  // Sezione 2 — Comportamento e responsabilità
  s2_title: string;
  s2_items: string[];
  // Sezione 3 — Deposito cauzionale
  s3_title: string;
  s3_text: string;
  s3_link: string;
  s3_href: string;
  // Tariffe
  rates_title: string;
  rates_note: string;
  rate_1_3: string;
  rate_4_7: string;
  rate_8plus: string;
  nights_label: string;
  price_label: string;
  // Firma
  sign_title: string;
  sign_text: string;
  // Numero massimo
  max_label: string;
}> = {

  // ── ITALIANO ──────────────────────────────────────────────────────────────────
  it: {
    hero_title: 'I vostri amici a 4 zampe sono benvenuti',
    hero_sub: 'Abbiamo pensato a tutto per rendere il soggiorno piacevole per voi e per loro. Leggi le regole qui sotto — ci eviteremo incomprensioni.',
    legal_note: 'In ottemperanza alla Legge 281/1991, all\'art. 83 del D.P.R. 320/1954 e alla L.R. Lazio n. 34/1997.',
    s1_title: 'Quali animali sono ammessi',
    s1_items: [
      'Massimo 1 animale domestico per appartamento.',
      'Cani di piccola e media taglia — peso massimo 15 kg (eccezione per cani guida).',
      'L\'animale deve essere identificato con microchip e iscritto all\'anagrafe canina.',
      'Il libretto sanitario deve essere portato in vacanza con indicazione del microchip e delle vaccinazioni aggiornate.',
      'La struttura si riserva di verificare la documentazione.',
    ],
    s2_title: 'Comportamento e responsabilità',
    s2_items: [
      'L\'animale deve essere al guinzaglio o in trasportino nelle aree comuni della struttura.',
      'È vietato lasciare l\'animale incustodito in casa.',
      'È severamente vietato far salire l\'animale sul letto o sul divano.',
      'L\'animale deve essere abituato alla vita in casa e a un regime di pulizia.',
      'La struttura può richiedere il rimborso delle spese di pulizia straordinaria se necessarie.',
      'Il proprietario è responsabile per qualsiasi danno materiale o fisico causato dall\'animale.',
      'In caso di comportamento rumoroso persistente, la direzione può richiedere di lasciare la struttura. Il proprietario accetta questa condizione firmando il regolamento.',
    ],
    s3_title: 'Deposito cauzionale',
    s3_text: 'Il deposito cauzionale è obbligatorio per gli ospiti con animali. Viene versato esclusivamente con Carta di Credito (no Debit Card, no PostePay) e restituito integralmente entro 48 ore dalla partenza in assenza di danni.',
    s3_link: 'Come funziona il deposito →', s3_href: '/it/deposito',
    rates_title: 'Supplemento animali',
    rates_note: 'Il supplemento viene calcolato sulla durata del soggiorno e pagato al check-in.',
    rate_1_3: '€ 30,00 / notte',
    rate_4_7: '€ 20,00 / notte',
    rate_8plus: '€ 10,00 / notte',
    nights_label: 'Durata soggiorno',
    price_label: 'Supplemento giornaliero',
    sign_title: 'Accettazione del regolamento',
    sign_text: 'Al momento del check-in sarà richiesta la firma del presente regolamento. La firma costituisce accettazione di tutte le condizioni indicate.',
    max_label: 'max 15 kg',
  },

  // ── ENGLISH ───────────────────────────────────────────────────────────────────
  en: {
    hero_title: 'Your four-legged friends are welcome',
    hero_sub: 'We have thought of everything to make the stay enjoyable for you and your pet. Please read the rules below to avoid any misunderstandings.',
    legal_note: 'In compliance with Italian Law 281/1991, Art. 83 of D.P.R. 320/1954 and Lazio Regional Law No. 34/1997.',
    s1_title: 'Which pets are accepted',
    s1_items: [
      'Maximum 1 pet per apartment.',
      'Small and medium-sized dogs — maximum weight 15 kg (exception for guide dogs).',
      'The animal must be microchipped and registered in the canine register.',
      'The health booklet must be brought on holiday, with microchip number and up-to-date vaccination records.',
      'The property reserves the right to verify documentation.',
    ],
    s2_title: 'Behaviour and responsibility',
    s2_items: [
      'The animal must be on a lead or in a carrier in the common areas of the property.',
      'Pets must not be left unattended in the apartment.',
      'It is strictly forbidden to allow the animal onto the bed or sofa.',
      'The animal must be accustomed to indoor living and to cleanliness standards.',
      'The property may charge for any extraordinary cleaning costs if required.',
      'The owner is responsible for any material or physical damage caused by the animal.',
      'In the event of persistent noisy behaviour, management may ask that the animal leave the property. The owner accepts this condition by signing the policy.',
    ],
    s3_title: 'Security deposit',
    s3_text: 'A security deposit is mandatory for guests travelling with pets. It is paid exclusively by Credit Card (no Debit Card, no PostePay) and refunded in full within 48 hours of departure provided there is no damage.',
    s3_link: 'How the deposit works →', s3_href: '/en/deposito',
    rates_title: 'Pet supplement',
    rates_note: 'The supplement is calculated based on the length of stay and paid at check-in.',
    rate_1_3: '€ 30.00 / night',
    rate_4_7: '€ 20.00 / night',
    rate_8plus: '€ 10.00 / night',
    nights_label: 'Length of stay',
    price_label: 'Daily supplement',
    sign_title: 'Acceptance of the policy',
    sign_text: 'At check-in, guests will be asked to sign this policy. Signing constitutes acceptance of all the conditions set out herein.',
    max_label: 'max 15 kg',
  },

  // ── DEUTSCH ───────────────────────────────────────────────────────────────────
  de: {
    hero_title: 'Ihre Vierbeiner sind herzlich willkommen',
    hero_sub: 'Wir haben an alles gedacht, um den Aufenthalt für Sie und Ihr Tier angenehm zu gestalten. Bitte lesen Sie die folgenden Regeln, um Missverständnisse zu vermeiden.',
    legal_note: 'Gemäß dem italienischen Gesetz 281/1991, Art. 83 des D.P.R. 320/1954 und dem Regionalgesetz Latium Nr. 34/1997.',
    s1_title: 'Welche Tiere sind erlaubt',
    s1_items: [
      'Maximal 1 Haustier pro Wohnung.',
      'Hunde kleiner und mittlerer Größe — maximales Gewicht 15 kg (Ausnahme für Blindenhunde).',
      'Das Tier muss gechipt und im Hunderegister eingetragen sein.',
      'Das Impfbuch muss mit Chip-Nummer und aktuellem Impfstatus mitgebracht werden.',
      'Die Unterkunft behält sich das Recht vor, die Unterlagen zu überprüfen.',
    ],
    s2_title: 'Verhalten und Verantwortung',
    s2_items: [
      'Das Tier muss in den Gemeinschaftsbereichen der Unterkunft an der Leine oder im Transportbehälter geführt werden.',
      'Haustiere dürfen nicht unbeaufsichtigt in der Wohnung gelassen werden.',
      'Es ist strengstens verboten, dem Tier zu erlauben, auf das Bett oder das Sofa zu klettern.',
      'Das Tier muss an das Leben in der Wohnung und an Hygienestandards gewöhnt sein.',
      'Die Unterkunft kann die Kosten für außerordentliche Reinigungsarbeiten in Rechnung stellen, falls erforderlich.',
      'Der Besitzer haftet für alle materiellen oder körperlichen Schäden, die durch das Tier verursacht werden.',
      'Bei anhaltendem störendem Verhalten kann die Verwaltung das Verlassen der Unterkunft fordern. Der Besitzer akzeptiert diese Bedingung mit der Unterzeichnung der Hausordnung.',
    ],
    s3_title: 'Kaution',
    s3_text: 'Eine Kaution ist für Gäste mit Haustieren obligatorisch. Sie wird ausschließlich mit Kreditkarte bezahlt (keine Debitkarte, keine Prepaid-Karte) und bei Abreise vollständig zurückerstattet, sofern keine Schäden entstanden sind.',
    s3_link: 'So funktioniert die Kaution →', s3_href: '/de/deposito',
    rates_title: 'Haustieraufpreis',
    rates_note: 'Der Aufpreis wird anhand der Aufenthaltsdauer berechnet und beim Check-in bezahlt.',
    rate_1_3: '€ 30,00 / Nacht',
    rate_4_7: '€ 20,00 / Nacht',
    rate_8plus: '€ 10,00 / Nacht',
    nights_label: 'Aufenthaltsdauer',
    price_label: 'Täglicher Aufpreis',
    sign_title: 'Akzeptanz der Hausordnung',
    sign_text: 'Beim Check-in werden die Gäste gebeten, diese Hausordnung zu unterzeichnen. Die Unterzeichnung bedeutet die Akzeptanz aller darin aufgeführten Bedingungen.',
    max_label: 'max. 15 kg',
  },

  // ── POLSKI ────────────────────────────────────────────────────────────────────
  pl: {
    hero_title: 'Wasze czworonożne przyjaciela są mile widziane',
    hero_sub: 'Zadbaliśmy o wszystko, aby pobyt był przyjemny zarówno dla Was, jak i dla zwierząt. Proszę zapoznać się z poniższym regulaminem, aby uniknąć nieporozumień.',
    legal_note: 'Zgodnie z włoską Ustawą 281/1991, Art. 83 D.P.R. 320/1954 i Regionalnym Prawem Lacjum Nr 34/1997.',
    s1_title: 'Jakie zwierzęta są dopuszczone',
    s1_items: [
      'Maksymalnie 1 zwierzę domowe na apartament.',
      'Psy małej i średniej wielkości — maksymalna waga 15 kg (wyjątek dla psów przewodników).',
      'Zwierzę musi być oznakowane chipem i zarejestrowane w rejestrze psów.',
      'Książeczka zdrowia z numerem chipa i aktualnymi szczepieniami musi być dostępna podczas pobytu.',
      'Obiekt zastrzega sobie prawo do sprawdzenia dokumentów.',
    ],
    s2_title: 'Zachowanie i odpowiedzialność',
    s2_items: [
      'Zwierzę musi być prowadzone na smyczy lub w transporterze w częściach wspólnych obiektu.',
      'Zwierząt nie wolno pozostawiać bez opieki w apartamencie.',
      'Surowo zabrania się wpuszczania zwierzęcia na łóżko lub sofę.',
      'Zwierzę musi być przyzwyczajone do życia w pomieszczeniu i do standardów czystości.',
      'Obiekt może obciążyć kosztami nadzwyczajnego sprzątania, jeśli będzie to konieczne.',
      'Właściciel odpowiada za wszelkie szkody materialne lub fizyczne spowodowane przez zwierzę.',
      'W przypadku utrzymującego się hałaśliwego zachowania kierownictwo może poprosić o opuszczenie obiektu. Właściciel akceptuje ten warunek, podpisując regulamin.',
    ],
    s3_title: 'Kaucja',
    s3_text: 'Kaucja jest obowiązkowa dla gości podróżujących ze zwierzętami. Płatna wyłącznie kartą kredytową (nie kartą debetową, nie kartą prepaid) i zwracana w całości w ciągu 48 godzin od wyjazdu, pod warunkiem braku szkód.',
    s3_link: 'Jak działa kaucja →', s3_href: '/pl/deposito',
    rates_title: 'Dopłata za zwierzęta',
    rates_note: 'Dopłata jest obliczana na podstawie długości pobytu i płatna przy zameldowaniu.',
    rate_1_3: '€ 30,00 / noc',
    rate_4_7: '€ 20,00 / noc',
    rate_8plus: '€ 10,00 / noc',
    nights_label: 'Długość pobytu',
    price_label: 'Dopłata dzienna',
    sign_title: 'Akceptacja regulaminu',
    sign_text: 'Przy zameldowaniu goście zostaną poproszeni o podpisanie niniejszego regulaminu. Podpis oznacza akceptację wszystkich wskazanych warunków.',
    max_label: 'maks. 15 kg',
  },
};

// ─── Dati tariffe ──────────────────────────────────────────────────────────
const RATES = (t: typeof T['it']) => [
  { nights: '1 – 3', price: t.rate_1_3 },
  { nights: '4 – 7', price: t.rate_4_7 },
  { nights: '8+',    price: t.rate_8plus },
];

// ─── Componente principale ──────────────────────────────────────────────────
export default function AnimaliClient({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 1.25rem 4rem' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '3.5rem 0 2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🐾</div>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
          fontWeight: 700,
          color: '#1E73BE',
          marginBottom: '0.75rem',
          lineHeight: 1.3,
        }}>
          {t.hero_title}
        </h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', maxWidth: 560, margin: '0 auto 1rem' }}>
          {t.hero_sub}
        </p>
        <p style={{ fontSize: '0.78rem', color: '#9ca3af', maxWidth: 560, margin: '0 auto', fontStyle: 'italic' }}>
          {t.legal_note}
        </p>
      </section>

      {/* ── 3 Sezioni card ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>

        {/* Card 1 — Quali animali */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>🐕 {t.s1_title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{
              background: '#FCAF1A',
              color: '#111',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '0.25rem 0.75rem',
              borderRadius: 20,
            }}>
              {t.max_label}
            </span>
          </div>
          <ul style={listStyle}>
            {t.s1_items.map((item, i) => (
              <li key={i} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Card 2 — Comportamento */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>📋 {t.s2_title}</h2>
          <ul style={listStyle}>
            {t.s2_items.map((item, i) => (
              <li key={i} style={listItemStyle}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Card 3 — Deposito */}
        <div style={{ ...cardStyle, borderColor: '#1E73BE', borderWidth: 1.5 }}>
          <h2 style={cardTitleStyle}>💳 {t.s3_title}</h2>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {t.s3_text}
          </p>
          <a href={t.s3_href} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 8, fontSize: '0.82rem', color: '#1E73BE', textDecoration: 'none', fontWeight: 600 }}>
            {t.s3_link}
          </a>
        </div>

      </div>

      {/* ── Tabella tariffe ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={sectionTitleStyle}>{t.rates_title}</h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {t.rates_note}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>{t.nights_label}</th>
                <th style={thStyle}>{t.price_label}</th>
              </tr>
            </thead>
            <tbody>
              {RATES(t).map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td style={tdStyle}>🌙 {row.nights} notti</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1E73BE' }}>{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Firma ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: '1.25rem',
        marginBottom: '2rem',
      }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#374151' }}>
          ✍️ {t.sign_title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
          {t.sign_text}
        </p>
        <div style={{
          marginTop: '1.25rem',
          borderTop: '1px solid #d1d5db',
          paddingTop: '1rem',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '2rem',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>Data</p>
            <div style={{ borderBottom: '1px solid #9ca3af', height: 24 }} />
          </div>
          <div style={{ flex: 2 }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>Firma</p>
            <div style={{ borderBottom: '1px solid #9ca3af', height: 24 }} />
          </div>
        </div>
      </section>

    </div>
  );
}

// ─── Stili ─────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '1.5rem',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#1E73BE',
  marginBottom: '1rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: '#1E73BE',
  marginBottom: '0.5rem',
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '1.2rem',
};

const listItemStyle: React.CSSProperties = {
  marginBottom: '0.5rem',
  fontSize: '0.92rem',
  color: '#374151',
  lineHeight: 1.55,
};

const thStyle: React.CSSProperties = {
  background: '#1E73BE',
  color: 'white',
  padding: '0.6rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.875rem',
};

const tdStyle: React.CSSProperties = {
  padding: '0.65rem 1rem',
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
};
