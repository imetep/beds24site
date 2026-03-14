'use client';

import { useWizardStore } from '@/store/wizard-store';
import { getAvailableRooms, getPropertyForRoom } from '@/config/properties';
import type { Room } from '@/config/properties';

const LABELS: Record<string, Record<string, string>> = {
  it: {
    title: 'Quale appartamento preferite?',
    bedrooms: 'camere',
    maxPeople: 'max',
    privatePool: '🏊 Piscina privata',
    sharedPool: '🌊 Piscina condivisa',
    noPool: '🏖️ Senza piscina',
    people: 'persone',
    select: 'Seleziona',
    selected: '✓ Selezionato',
    continua: 'Continua →',
    indietro: '← Indietro',
    stepOf: 'Step 5 di 6',
    near: 'Vicino al mare',
    nature: 'Immerso nella natura',
  },
  en: {
    title: 'Which apartment do you prefer?',
    bedrooms: 'bedrooms',
    maxPeople: 'max',
    privatePool: '🏊 Private pool',
    sharedPool: '🌊 Shared pool',
    noPool: '🏖️ No pool',
    people: 'people',
    select: 'Select',
    selected: '✓ Selected',
    continua: 'Continue →',
    indietro: '← Back',
    stepOf: 'Step 5 of 6',
    near: 'Near the sea',
    nature: 'Surrounded by nature',
  },
  de: {
    title: 'Welche Unterkunft bevorzugen Sie?',
    bedrooms: 'Schlafzimmer',
    maxPeople: 'max',
    privatePool: '🏊 Privater Pool',
    sharedPool: '🌊 Gemeinschaftspool',
    noPool: '🏖️ Kein Pool',
    people: 'Personen',
    select: 'Auswählen',
    selected: '✓ Ausgewählt',
    continua: 'Weiter →',
    indietro: '← Zurück',
    stepOf: 'Schritt 5 von 6',
    near: 'In Meeresnähe',
    nature: 'In der Natur',
  },
  pl: {
    title: 'Który apartament preferujecie?',
    bedrooms: 'sypialnie',
    maxPeople: 'maks',
    privatePool: '🏊 Prywatny basen',
    sharedPool: '🌊 Wspólny basen',
    noPool: '🏖️ Bez basenu',
    people: 'osoby',
    select: 'Wybierz',
    selected: '✓ Wybrano',
    continua: 'Dalej →',
    indietro: '← Wstecz',
    stepOf: 'Krok 5 z 6',
    near: 'Blisko morza',
    nature: 'Wśród natury',
  },
};

interface Props {
  locale?: string;
}

export default function WizardStep5({ locale = 'it' }: Props) {
  const t = LABELS[locale] ?? LABELS.it;
  const { numAdult, numChild, poolPreference, selectedRoomId, setSelectedRoomId, nextStep, prevStep } =
    useWizardStore();

  const totalGuests = numAdult + numChild;
  const availableRooms = getAvailableRooms(totalGuests, poolPreference);

  function handleSelect(roomId: number) {
    setSelectedRoomId(roomId);
  }

  function handleContinua() {
    if (!selectedRoomId) return;
    nextStep();
  }

  function getPoolLabel(room: Room): string {
    if (room.privatePool) return t.privatePool;
    if (room.sharedPool) return t.sharedPool;
    return t.noPool;
  }

  function getLocationLabel(room: Room): string {
    const prop = getPropertyForRoom(room.roomId);
    if (!prop) return '';
    return prop.propertyId === 46871 ? t.near : t.nature;
  }

  return (
    <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>

      {/* Step indicator */}
      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{t.stepOf}</div>

      {/* Titolo */}
      <h2 style={{ color: '#1E73BE', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        {t.title}
      </h2>

      {/* Lista rooms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {availableRooms.map((room) => {
          const isSelected = selectedRoomId === room.roomId;
          return (
            <button
              key={room.roomId}
              onClick={() => handleSelect(room.roomId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '16px 18px',
                borderRadius: 12,
                border: isSelected ? '2px solid #1E73BE' : '2px solid #e0e0e0',
                background: isSelected ? '#EEF5FC' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                width: '100%',
              }}
            >
              {/* Nome + tipo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#222' }}>{room.name}</span>
                {isSelected && (
                  <span style={{ fontSize: 13, color: '#1E73BE', fontWeight: 600 }}>{t.selected}</span>
                )}
              </div>

              {/* Dettagli */}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={badgeStyle}>
                  🛏️ {room.bedrooms} {t.bedrooms}
                </span>
                <span style={badgeStyle}>
                  👥 {t.maxPeople} {room.maxPeople} {t.people}
                </span>
                <span style={badgeStyle}>
                  {getPoolLabel(room)}
                </span>
                <span style={badgeStyle}>
                  📍 {getLocationLabel(room)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continua */}
      <button
        onClick={handleContinua}
        disabled={!selectedRoomId}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 12,
          border: 'none',
          background: selectedRoomId ? '#FCAF1A' : '#e0e0e0',
          color: selectedRoomId ? '#fff' : '#999',
          fontSize: 16,
          fontWeight: 700,
          cursor: selectedRoomId ? 'pointer' : 'not-allowed',
          marginBottom: 16,
        }}
      >
        {t.continua}
      </button>

      {/* Indietro */}
      <button
        onClick={prevStep}
        style={{
          background: 'none',
          border: 'none',
          color: '#1E73BE',
          fontSize: 14,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {t.indietro}
      </button>

    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#555',
  background: '#f5f5f5',
  borderRadius: 6,
  padding: '3px 8px',
};
