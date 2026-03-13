'use client';

import { useWizardStore } from '@/store/wizard-store';
import DatePicker, { registerLocale } from 'react-datepicker';
import { it } from 'date-fns/locale/it';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('it', it);

interface Props {
  translations: {
    step2: {
      title: string;
      checkin: string;
      checkout: string;
      next: string;
    };
  };
}

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

function fromYMD(str: string | null): Date | null {
  if (!str) return null;
  return new Date(str + 'T00:00:00');
}

function nightsBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export default function WizardStep2({ translations: t }: Props) {
  const { checkIn, checkOut, setCheckIn, setCheckOut, nextStep } = useWizardStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkInDate = fromYMD(checkIn);
  const checkOutDate = fromYMD(checkOut);
  const canContinue = !!(checkIn && checkOut);
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : null;

  function handleCheckIn(date: Date | null) {
    if (!date) return;
    setCheckIn(toYMD(date));
    if (checkOut && new Date(checkOut) <= date) setCheckOut('');
  }

  function handleCheckOut(date: Date | null) {
    if (!date) return;
    setCheckOut(toYMD(date));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 1.5rem', color: '#1E73BE' }}>
        {t.step2.title}
      </h2>

      {/* CHECK-IN */}
      <div style={fieldWrap}>
        <label style={labelStyle}>{t.step2.checkin}</label>
        <DatePicker
          selected={checkInDate}
          onChange={handleCheckIn}
          minDate={today}
          locale="it"
          dateFormat="dd MMMM yyyy"
          placeholderText="Seleziona data"
          calendarStartDay={1}
          customInput={<CustomInput />}
          popperPlacement="bottom-start"
        />
      </div>

      {/* CHECK-OUT */}
      <div style={fieldWrap}>
        <label style={labelStyle}>{t.step2.checkout}</label>
        <DatePicker
          selected={checkOutDate}
          onChange={handleCheckOut}
          minDate={checkInDate ? new Date(checkInDate.getTime() + 86400000) : today}
          locale="it"
          dateFormat="dd MMMM yyyy"
          placeholderText={checkIn ? 'Seleziona data' : 'Prima scegli il check-in'}
          disabled={!checkIn}
          calendarStartDay={1}
          customInput={<CustomInput disabled={!checkIn} />}
          popperPlacement="bottom-start"
        />
      </div>

      {/* Badge notti */}
      {nights && (
        <div style={nightsBadge}>
          {nights} {nights === 1 ? 'notte' : 'notti'}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
        <button
          onClick={nextStep}
          disabled={!canContinue}
          style={btnStyle(canContinue)}
        >
          {t.step2.next} →
        </button>
      </div>

      <style>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .react-datepicker__header {
          background: #1E73BE;
          border-bottom: none;
          padding: 12px 0 8px;
        }
        .react-datepicker__current-month {
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
        }
        .react-datepicker__day-name {
          color: rgba(255,255,255,0.8);
          font-size: 0.8rem;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #fff;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-range,
        .react-datepicker__day--range-start,
        .react-datepicker__day--range-end {
          background: #1E73BE !important;
          color: #fff !important;
          border-radius: 50% !important;
        }
        .react-datepicker__day--in-selecting-range {
          background: #EBF4FC !important;
          color: #1E73BE !important;
        }
        .react-datepicker__day:hover {
          background: #EBF4FC;
          color: #1E73BE;
          border-radius: 50%;
        }
        .react-datepicker__day--keyboard-selected {
          background: #EBF4FC;
          color: #1E73BE;
        }
        .react-datepicker__day--disabled {
          color: #ccc !important;
        }
        .react-datepicker__today-button {
          background: #f9f9f9;
          border-top: 1px solid #eee;
          color: #1E73BE;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

const CustomInput = ({ value, onClick, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '0.85rem 1rem',
      fontSize: '1rem',
      border: `1.5px solid ${value ? '#1E73BE' : '#e5e7eb'}`,
      borderRadius: '10px',
      background: value ? '#EBF4FC' : '#fff',
      color: value ? '#1E73BE' : '#999',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textAlign: 'left',
      fontWeight: value ? 600 : 400,
      opacity: disabled ? 0.5 : 1,
      boxSizing: 'border-box',
      display: 'block',
    }}
  >
    {value || 'Seleziona data'}
  </button>
);

const fieldWrap: React.CSSProperties = {
  marginBottom: '1.25rem',
  position: 'relative',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.4rem',
};

const nightsBadge: React.CSSProperties = {
  display: 'inline-block',
  background: '#EBF4FC',
  color: '#1E73BE',
  border: '1px solid #1E73BE',
  borderRadius: '20px',
  padding: '0.3rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  marginTop: '0.25rem',
};

const btnStyle = (active: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '0.9rem',
  background: active ? '#FCAF1A' : '#e5e7eb',
  color: active ? '#fff' : '#aaa',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: active ? 'pointer' : 'not-allowed',
});
