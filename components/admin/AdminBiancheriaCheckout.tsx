'use client';

/**
 * AdminBiancheriaCheckout — vista biancheria orientata al check-out (Fase 4b).
 *
 * Per ogni partenza nel range, mostra:
 *   - Dati della prenotazione che esce
 *   - Prossima prenotazione sulla stessa casa (se esiste)
 *   - Biancheria da preparare per quel prossimo arrivo
 *   - Gap in giorni tra partenza e prossimo arrivo
 *
 * Toggle in alto: "Check-in" (vista originale) / "Check-out" (questa vista).
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

// ─── Tipi vista ──────────────────────────────────────────────────────────────

interface LinenResult {
  lenzMatrimoniali: number;
  lenzSingoli:      number;
  federe:           number;
  persone:          number;
  scendibagno?:     number;
  culle:            number;
}

interface DepartureBooking {
  bookId:    number;
  roomId:    number;
  roomName:  string;
  arrival:   string;
  departure: string;
  guestName: string;
  numAdult:  number;
  numChild:  number;
}

interface NextArrival {
  bookId:    number;
  roomId:    number;
  roomName:  string;
  arrival:   string;
  departure: string;
  guestName: string;
  numAdult:  number;
  numChild:  number;
  source:    'guest' | 'admin' | 'default';
  hasConfig: boolean;
  linen:     LinenResult | null;
}

interface CheckoutItem {
  departure:    DepartureBooking;
  nextArrival:  NextArrival | null;
  gapDays:      number | null;
}

interface ApiResponse {
  items:  CheckoutItem[];
  totals: LinenResult;
  from:   string;
  to:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtData(ymd: string): string {
  return new Date(ymd + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function todayYMD(): string { return new Date().toISOString().slice(0, 10); }
function plusDaysYMD(d: number): string {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

// ─── Login ───────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true); setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) onLogin();
    else setErr('Password errata');
    setBusy(false);
  }
  return (
    <div className="container" style={{ maxWidth: 360 }}>
      <div className="card shadow-sm mt-5">
        <div className="card-body p-4">
          <p className="fs-4 fw-bold mb-1"><Icon name="lock-fill" className="me-1" /> Admin</p>
          <p className="text-muted small mb-3">Biancheria — LivingApple</p>
          <input type="password" className="form-control mb-2" placeholder="Password"
            value={pwd} onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} />
          {err && <p className="small text-danger mb-2">{err}</p>}
          <button className="btn btn-success fw-bold w-100" onClick={login} disabled={busy}>
            {busy ? 'Accesso…' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LinenSummary (compatto) ────────────────────────────────────────────────

function LinenSummary({ linen }: { linen: LinenResult }) {
  const items = [
    { icon: 'moon-stars-fill' as const, val: linen.lenzMatrimoniali, label: 'lenz. matr', title: 'Lenzuola matrimoniali' },
    { icon: 'moon-stars-fill' as const, val: linen.lenzSingoli,      label: 'lenz. sing', title: 'Lenzuola singole' },
    { icon: 'box-fill'        as const, val: linen.federe,           label: 'federe',     title: 'Federe' },
    { icon: 'person-fill'     as const, val: linen.persone,          label: 'viso',       title: 'Asciugamano viso' },
    { icon: 'person-fill'     as const, val: linen.persone,          label: 'bidet',      title: 'Asciugamano bidet' },
    { icon: 'droplet-fill'    as const, val: linen.persone,          label: 'telo doc.',  title: 'Telo doccia' },
    { icon: 'box-fill'        as const, val: linen.scendibagno ?? 1, label: 'scendib.',   title: 'Scendibagno' },
  ];
  return (
    <div className="d-flex gap-2 flex-wrap mt-2">
      {items.map((item, i) => (
        <span key={i} title={item.title}
          className="d-inline-flex align-items-center gap-1 bg-light rounded px-2 py-1 small">
          <Icon name={item.icon} size={14} />
          <b>{item.val}</b>
          <span className="text-muted">{item.label}</span>
        </span>
      ))}
      {linen.culle > 0 && (
        <span className="d-inline-flex align-items-center gap-1 bg-light rounded px-2 py-1 small">
          <Icon name="person-arms-up" size={14} />
          <b>{linen.culle}</b>
          <span className="text-muted">culle</span>
        </span>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: NextArrival['source'] }) {
  const map = {
    guest:   { cls: 'bg-success-subtle text-success-emphasis',   label: 'Ospite' },
    admin:   { cls: 'bg-primary-subtle text-primary-emphasis',   label: 'Admin'  },
    default: { cls: 'bg-warning-subtle text-warning-emphasis',   label: 'Auto'  },
  };
  const s = map[source];
  return <span className={`badge rounded-pill ${s.cls}`}>{s.label}</span>;
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminBiancheriaCheckout() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data,   setData]   = useState<ApiResponse | null>(null);
  const [from,   setFrom]   = useState(todayYMD());
  const [to,     setTo]     = useState(plusDaysYMD(14));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/checkin')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/biancheria-checkout?from=${from}&to=${to}`);
      if (!res.ok) { setError('Errore caricamento'); return; }
      setData(await res.json());
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  }

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  // Raggruppa per data partenza
  const byDate = new Map<string, CheckoutItem[]>();
  if (data) {
    for (const item of data.items) {
      const k = item.departure.departure;
      const arr = byDate.get(k) ?? [];
      arr.push(item);
      byDate.set(k, arr);
    }
  }
  const dateOrdinate = Array.from(byDate.keys()).sort();

  const conProssimo = data?.items.filter(i => i.nextArrival).length ?? 0;
  const senzaProssimo = data ? data.items.length - conProssimo : 0;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0"><Icon name="moon-stars-fill" className="me-1" /> Biancheria</h1>
          <p className="small text-muted mb-0">
            Vista check-out: prepara biancheria per il prossimo arrivo
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            <Icon name="arrow-clockwise" /> Aggiorna
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {/* Toggle vista check-in / check-out */}
      <div className="d-flex gap-1 mb-3">
        <span className="small fw-semibold text-muted me-2 align-self-center">Vista:</span>
        <button className="btn btn-sm"
          onClick={() => router.push('/admin/biancheria')}
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 999,
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}>
          Check-in
        </button>
        <button className="btn btn-sm"
          style={{
            border: '2px solid var(--color-primary)',
            borderRadius: 999,
            background: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            fontWeight: 600,
          }}>
          Check-out
        </button>
      </div>

      {/* Filtri date */}
      <div className="d-flex gap-2 align-items-center flex-wrap mb-3">
        <label className="small fw-semibold text-muted">Partenze dal</label>
        <input type="date" className="form-control form-control-sm" style={{ maxWidth: 160 }}
          value={from} onChange={e => setFrom(e.target.value)} />
        <label className="small fw-semibold text-muted">al</label>
        <input type="date" className="form-control form-control-sm" style={{ maxWidth: 160 }}
          value={to} onChange={e => setTo(e.target.value)} />
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* Totali aggregati */}
      {data && conProssimo > 0 && (
        <div className="card mb-3" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div className="card-body p-3">
            <p className="small fw-bold text-uppercase mb-2"
              style={{ color: '#0369a1', letterSpacing: '0.06em' }}>
              Totale da preparare — {conProssimo} prossimi arrivi
            </p>
            <div className="d-flex gap-3 flex-wrap fw-bold" style={{ color: '#0c4a6e' }}>
              <span><Icon name="moon-stars-fill" size={14} /> {data.totals.lenzMatrimoniali} lenz.matr</span>
              <span><Icon name="moon-stars-fill" size={14} /> {data.totals.lenzSingoli} lenz.sing</span>
              <span><Icon name="box-fill" size={14} /> {data.totals.federe} federe</span>
              <span><Icon name="person-fill" size={14} /> {data.totals.persone} viso</span>
              <span><Icon name="person-fill" size={14} /> {data.totals.persone} bidet</span>
              <span><Icon name="droplet-fill" size={14} /> {data.totals.persone} telo doccia</span>
              {data.totals.culle > 0 && (
                <span><Icon name="person-arms-up" size={14} /> {data.totals.culle} culle</span>
              )}
            </div>
          </div>
        </div>
      )}

      {data && senzaProssimo > 0 && (
        <div className="alert alert-info py-2 small">
          <Icon name="info-circle-fill" className="me-1" />
          {senzaProssimo} partenz{senzaProssimo === 1 ? 'a' : 'e'} senza prossimo arrivo nei 90 giorni successivi:
          la casa resta vuota, niente biancheria da preparare.
        </div>
      )}

      {!loading && data && data.items.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-0">Nessuna partenza nel periodo selezionato.</p>
          </div>
        </div>
      )}

      {/* Lista per data partenza */}
      {dateOrdinate.map(dateKey => (
        <div key={dateKey}>
          <div className="d-flex align-items-center gap-2 mt-4 mb-2">
            <span className="small fw-bold text-secondary text-nowrap">
              <Icon name="calendar-event" className="me-1" />
              Check-out {fmtData(dateKey)}
            </span>
            <div className="flex-fill border-top" />
          </div>

          {byDate.get(dateKey)!.map(item => (
            <div key={item.departure.bookId} className="card shadow-sm mb-2">
              <div className="card-body p-3">
                {/* Header partenza */}
                <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
                  <div>
                    <p className="fw-bold mb-0">
                      <Icon name="house-fill" className="me-1" />
                      {item.departure.roomName}
                    </p>
                    <p className="small text-muted mb-0">
                      Esce: {item.departure.guestName} · {item.departure.numAdult} adult{item.departure.numAdult === 1 ? 'o' : 'i'}
                      {item.departure.numChild > 0 && ` + ${item.departure.numChild} bambin${item.departure.numChild === 1 ? 'o' : 'i'}`}
                    </p>
                  </div>
                  <span className="badge bg-secondary-subtle text-secondary-emphasis">
                    Beds24 #{item.departure.bookId}
                  </span>
                </div>

                {/* Prossimo arrivo + biancheria */}
                {item.nextArrival ? (
                  <div className="border-top pt-2 mt-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <span className="badge text-uppercase"
                        style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontSize: 10 }}>
                        Prossimo arrivo
                      </span>
                      <span className="small fw-semibold">
                        {fmtData(item.nextArrival.arrival)}
                      </span>
                      <span className="small text-muted">
                        ({item.gapDays === 0 ? 'stesso giorno' : `+${item.gapDays} giorn${item.gapDays === 1 ? 'o' : 'i'}`})
                      </span>
                      <SourceBadge source={item.nextArrival.source} />
                      {!item.nextArrival.hasConfig && (
                        <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">Config N/D</span>
                      )}
                    </div>
                    <p className="small text-muted mb-0">
                      {item.nextArrival.guestName} · {item.nextArrival.numAdult} adult{item.nextArrival.numAdult === 1 ? 'o' : 'i'}
                      {item.nextArrival.numChild > 0 && ` + ${item.nextArrival.numChild} bambin${item.nextArrival.numChild === 1 ? 'o' : 'i'}`}
                      {' · '}fino al {fmtData(item.nextArrival.departure)}
                    </p>
                    {item.nextArrival.linen ? (
                      <LinenSummary linen={item.nextArrival.linen} />
                    ) : (
                      <p className="small text-muted fst-italic mt-1 mb-0">
                        Configurazione letti non disponibile per questa casa.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border-top pt-2 mt-2">
                    <p className="small fst-italic text-muted mb-0">
                      <Icon name="info-circle" className="me-1" />
                      Nessun prossimo arrivo nei 90 giorni — casa resta vuota dopo il check-out.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
