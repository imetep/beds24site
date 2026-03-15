'use client';

import { useEffect, useState } from 'react';

const MONTHS: Record<string, string[]> = {
  it: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  pl: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
};
const DAYS: Record<string, string[]> = {
  it: ['Lu','Ma','Me','Gi','Ve','Sa','Do'],
  en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
  de: ['Mo','Di','Mi','Do','Fr','Sa','So'],
  pl: ['Pn','Wt','Śr','Cz','Pt','So','Nd'],
};
const UI: Record<string, Record<string, string | ((...args: any[]) => string)>> = {
  it: { title:'Disponibilità', loading:'Caricamento...', prenota:'Prenota ora', prev:'Precedente', next:'Successivo', legend_free:'Disponibile', legend_busy:'Occupato' },
  en: { title:'Availability',  loading:'Loading...',     prenota:'Book now',    prev:'Previous',   next:'Next',       legend_free:'Available',   legend_busy:'Booked'   },
  de: { title:'Verfügbarkeit', loading:'Laden...',       prenota:'Jetzt buchen',prev:'Vorherige',  next:'Nächste',    legend_free:'Verfügbar',   legend_busy:'Belegt'   },
  pl: { title:'Dostępność',    loading:'Ładowanie...',   prenota:'Rezerwuj',    prev:'Poprzedni',  next:'Następny',   legend_free:'Dostępny',    legend_busy:'Zajęty'   },
};

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function addMonths(year: number, month: number, delta: number) {
  let m = month + delta;
  const y = year + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return { year: y, month: m };
}
function buildCells(year: number, month: number): (number|null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysCount = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);
  return cells;
}

interface Props {
  roomId: number;
  locale?: string;
  bookingUrl?: string; // non usato — la pagina ha già il bottone fisso in basso
}

export default function AvailabilityCalendar({ roomId, locale = 'it' }: Props) {
  const ui     = UI[locale]     ?? UI.it;
  const months = MONTHS[locale] ?? MONTHS.it;
  const days   = DAYS[locale]   ?? DAYS.it;

  const today = new Date(); today.setHours(0,0,0,0);
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // availMap: { "YYYY-MM-DD": true (disponibile) | false (occupato) }
  const [availMap, setAvailMap]   = useState<Record<string, boolean>>({});
  const [loading, setLoading]     = useState(true);

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/availability?roomId=${roomId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        console.log('[AvailabilityCalendar] raw data:', JSON.stringify(data).slice(0, 300));

        // Beds24 /inventory/rooms/availability risponde:
        // { data: [{ roomId, availability: { "YYYY-MM-DD": true/false } }] }
        const roomData = data?.data?.[0];
        const avail = roomData?.availability ?? {};
        console.log('[AvailabilityCalendar] availability keys count:', Object.keys(avail).length);

        const sample = Object.entries(avail).slice(0, 3);
        console.log('[AvailabilityCalendar] sample entries:', sample);

        const occupied = Object.entries(avail).filter(([, v]) => v === false).length;
        console.log('[AvailabilityCalendar] occupied days:', occupied);

        setAvailMap(avail);
      })
      .catch(err => console.error('[AvailabilityCalendar] fetch error:', err))
      .finally(() => setLoading(false));
  }, [roomId]);

  // Un giorno è "non disponibile" se:
  // - è nel passato, OPPURE
  // - availability[date] === false (Beds24 dice occupato)
  function isUnavailable(ymd: string): boolean {
    if (ymd < todayYMD) return true;
    // Se abbiamo dati Beds24 per questo giorno e dice false → occupato
    if (ymd in availMap) return availMap[ymd] === false;
    return false; // nessun dato = disponibile
  }

  const isPrevDisabled = toYMD(viewYear, viewMonth, 1) <= toYMD(today.getFullYear(), today.getMonth(), 1);
  function goToPrev() { if (isPrevDisabled) return; const p = addMonths(viewYear, viewMonth, -1); setViewYear(p.year); setViewMonth(p.month); }
  function goToNext() { const n = addMonths(viewYear, viewMonth, 1); setViewYear(n.year); setViewMonth(n.month); }

  const second = addMonths(viewYear, viewMonth, 1);

  function renderMonth(year: number, month: number, showTitle = true) {
    const cells = buildCells(year, month);
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        {showTitle && (
          <div style={{ textAlign:'center', fontWeight:700, fontSize:15, marginBottom:10, color:'#111' }}>
            {months[month]} {year}
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:2 }}>
          {days.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#aaa', paddingBottom:6 }}>{d}</div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ height:36 }} />;
            const ymd     = toYMD(year, month, day);
            const unavail = isUnavailable(ymd);
            const isPast  = ymd < todayYMD;
            const isToday = ymd === todayYMD;

            return (
              <div key={i} style={{
                height:36, display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative', fontSize:13, userSelect:'none', cursor:'default',
                // Passato → grigio chiaro
                // Occupato (non passato) → nero con strikethrough stile Airbnb
                // Disponibile → nero normale
                color: isPast ? '#c8c8c8' : '#111',
                fontWeight: isToday ? 700 : 400,
                textDecoration: (!isPast && unavail) ? 'line-through' : 'none',
                opacity: isPast ? 0.5 : 1,
              }}>
                {day}
                {isToday && (
                  <span style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'#1E73BE' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section style={{ marginTop:48 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, margin:'0 0 6px', color:'#111' }}>{ui.title}</h2>
          <div style={{ display:'flex', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#555' }}>
              <span>15</span> {ui.legend_free}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#bbb' }}>
              <span style={{ textDecoration:'line-through' }}>15</span> {ui.legend_busy}
            </div>
          </div>
        </div>

      </div>

      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 0', color:'#aaa', fontSize:14 }}>
          <div style={{ width:20, height:20, border:'2px solid #eee', borderTop:'2px solid #1E73BE', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
          {ui.loading}
        </div>
      )}

      {!loading && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:16, padding: isDesktop ? '20px 28px 24px' : '16px 12px 20px', background:'#fff' }}>
          {/* Navigazione */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <button onClick={goToPrev} disabled={isPrevDisabled} style={navBtn(isPrevDisabled)}>‹</button>
            {/* Su mobile mostra il titolo qui; su desktop lo mostra in renderMonth */}
          <div style={{ flex:1, textAlign: isDesktop ? 'center' : 'center' }}>
            {!isDesktop && (
              <span style={{ fontWeight:700, fontSize:15, color:'#111' }}>{months[viewMonth]} {viewYear}</span>
            )}
          </div>
            <button onClick={goToNext} style={navBtn(false)}>›</button>
          </div>

          <div style={{ display:'flex', gap: isDesktop ? 40 : 0 }}>
            {renderMonth(viewYear, viewMonth, isDesktop)}
            {isDesktop && (
              <>
                <div style={{ width:1, background:'#f0f0f0', flexShrink:0 }} />
                {renderMonth(second.year, second.month, true)}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

const navBtn = (disabled: boolean): React.CSSProperties => ({
  background:'none', border:'none', fontSize:26, lineHeight:1,
  cursor: disabled ? 'default' : 'pointer',
  color: disabled ? '#ddd' : '#333',
  padding:'0 8px', fontWeight:300, flexShrink:0,
});
