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
import RangeCalendar from '@/components/admin/RangeCalendar';

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

  // Magazzino — valori manuali prima dell'export, reset ad ogni caricamento pagina
  const ARTICOLI = ['lenzMatrimoniali', 'lenzSingoli', 'federe', 'viso', 'bidet', 'telodoccia', 'scendibagno'] as const;
  type ArticoloKey = typeof ARTICOLI[number];
  const ARTICOLI_LABEL: Record<ArticoloKey, string> = {
    lenzMatrimoniali: 'Lenzuolo matrimoniale',
    lenzSingoli:      'Lenzuolo singolo',
    federe:           'Federa sacco cuscino',
    viso:             'Asciugamano viso',
    bidet:            'Asciugamano bidet',
    telodoccia:       'Telo doccia',
    scendibagno:      'Scendibagno spugna',
  };
  const [magazzino, setMagazzino] = useState<Record<ArticoloKey, number>>({
    lenzMatrimoniali: 0, lenzSingoli: 0, federe: 0,
    viso: 0, bidet: 0, telodoccia: 0, scendibagno: 0,
  });

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

  async function exportXlsx() {
    if (!data || data.items.length === 0) return;
    const XLSX = await import('xlsx');

    const sourceLabel = (s: NextArrival['source']) =>
      s === 'guest' ? 'ospite' : s === 'admin' ? 'admin' : 'auto';

    const wsData: (string | number | Date | null)[][] = [
      ['importazione del', new Date()],
      ['maggiorazione manuale del biancheria', 0.2],
      [
        'Data partenza', 'Casa', 'Ospite uscente', 'N. uscenti',
        'Prossimo arrivo', 'Gap (gg)', 'Ospite entrante', 'N. entranti',
        'Lenz. matrim.', 'Lenz. singole', 'Federe',
        'Viso', 'Bidet', 'Telo doccia', 'Scendibagno', 'Culle',
        'Note',
      ],
    ];

    const firstDataRow = wsData.length + 1;       // 1-indexed Excel
    let lastDataRow = firstDataRow - 1;

    for (const item of data.items) {
      const dep = item.departure;
      const next = item.nextArrival;
      const dataRow: (string | number | Date | null)[] = [
        dep.departure,
        dep.roomName,
        dep.guestName,
        dep.numAdult + dep.numChild,
      ];
      if (next) {
        dataRow.push(
          next.arrival,
          item.gapDays ?? '',
          next.guestName,
          next.numAdult + next.numChild,
        );
        if (next.linen) {
          dataRow.push(
            next.linen.lenzMatrimoniali,
            next.linen.lenzSingoli,
            next.linen.federe,
            next.linen.persone,
            next.linen.persone,
            next.linen.persone,
            next.linen.scendibagno ?? 1,
            next.linen.culle,
          );
        } else {
          dataRow.push(null, null, null, null, null, null, null, null);
        }
        dataRow.push(`Config: ${sourceLabel(next.source)}${next.linen ? '' : ' · CONFIG N/D'}`);
      } else {
        dataRow.push('—', '—', '—', '—', null, null, null, null, null, null, null, null, 'Nessun prossimo arrivo (90gg)');
      }
      wsData.push(dataRow);
      lastDataRow = wsData.length;
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Riga totali (colonne biancheria I..P: lenz matr/sing, federe, viso, bidet, telo doccia, scendib, culle)
    const cols = ['I', 'J', 'K', 'L', 'M', 'N', 'O'];   // escludo P (culle) dal calcolo riordino
    let totRow = lastDataRow;
    if (lastDataRow >= firstDataRow) {
      totRow = lastDataRow + 1;
      ws[`A${totRow}`] = { v: 'TOTALE', t: 's' };
      for (const col of [...cols, 'P']) {
        ws[`${col}${totRow}`] = { f: `SUM(${col}${firstDataRow}:${col}${lastDataRow})`, t: 'n' };
      }
    }

    // Sezione riordino: tot necessario - magazzino → subtotale → maggiorazione → arrotonda*5
    const hdrRow = totRow + 3;
    ws[`D${hdrRow}`] = { v: 'articolo',           t: 's' };
    ws[`E${hdrRow}`] = { v: 'tot necessario',     t: 's' };
    ws[`F${hdrRow}`] = { v: 'magazzino',          t: 's' };
    ws[`G${hdrRow}`] = { v: 'subtotale',          t: 's' };
    ws[`H${hdrRow}`] = { v: 'maggiorazione',      t: 's' };
    ws[`I${hdrRow}`] = { v: 'arrotonda e ordina', t: 's' };

    const colMap: Array<{ col: string; label: string; key: ArticoloKey }> = [
      { col: 'I', label: 'lenzuolo matrimoniale',    key: 'lenzMatrimoniali' },
      { col: 'J', label: 'LENZUOLO SINGOLO',         key: 'lenzSingoli'      },
      { col: 'K', label: 'FEDERA SACCO cuscino',     key: 'federe'           },
      { col: 'L', label: 'ASCIUGAMANO VISO',         key: 'viso'             },
      { col: 'M', label: 'ASCIUGAMANO BIDET SPUGNA', key: 'bidet'            },
      { col: 'N', label: 'TELO DOCCIA',              key: 'telodoccia'       },
      { col: 'O', label: 'SCENDIBAGNO SPUGNA',       key: 'scendibagno'      },
    ];

    colMap.forEach(({ col, label, key }, idx) => {
      const r = hdrRow + 1 + idx;
      ws[`D${r}`] = { v: label,                  t: 's' };
      ws[`E${r}`] = { f: `${col}${totRow}`,      t: 'n' };
      ws[`F${r}`] = { v: magazzino[key],         t: 'n' };
      ws[`G${r}`] = { f: `E${r}-F${r}`,          t: 'n' };
      ws[`H${r}`] = { f: `(G${r}*$B$2)+G${r}`,  t: 'n' };
      ws[`I${r}`] = { f: `ROUND(H${r}/5,0)*5`,  t: 'n' };
    });

    const lastSecRow = hdrRow + colMap.length;
    ws['!ref'] = `A1:Q${lastSecRow}`;

    ws['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 8 },
      { wch: 14 }, { wch: 6 }, { wch: 22 }, { wch: 8 },
      { wch: 22 }, { wch: 18 }, { wch: 22 },
      { wch: 20 }, { wch: 24 }, { wch: 14 }, { wch: 20 }, { wch: 8 },
      { wch: 24 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Biancheria check-out');
    XLSX.writeFile(wb, `biancheria-checkout_${data.from}_${data.to}.xlsx`);
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
          <button
            className="btn btn-success btn-sm fw-bold"
            onClick={exportXlsx}
            disabled={!data || data.items.length === 0}
            title="Esporta lista biancheria in Excel">
            <Icon name="file-earmark-image" className="me-1" /> XLSX
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

      {/* Filtro date — pill calendario condivisa con vista check-in */}
      <div className="card mb-3">
        <div className="card-body p-3 d-flex align-items-start justify-content-between gap-3 flex-wrap">
          <RangeCalendar from={from} to={to}
            onChange={(f, t) => { setFrom(f); setTo(t); }} />
          <button className="btn btn-primary align-self-start"
            onClick={load} disabled={loading}>
            {loading ? 'Caricamento…' : <><Icon name="search" className="me-1" /> Carica</>}
          </button>
        </div>
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

      {/* Magazzino disponibile */}
      {data && data.items.length > 0 && (
        <div className="card mb-3">
          <div className="card-body p-3">
            <p className="small fw-bold text-uppercase text-secondary mb-3" style={{ letterSpacing: '0.06em' }}>
              <Icon name="box-fill" className="me-1" /> Magazzino disponibile
            </p>
            <div className="d-grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {ARTICOLI.map(key => (
                <label key={key}
                  className="d-flex align-items-center justify-content-between gap-2 bg-light rounded px-2 py-1 small text-secondary">
                  <span>{ARTICOLI_LABEL[key]}</span>
                  <input type="number" min={0}
                    value={magazzino[key]}
                    onChange={e => setMagazzino(prev => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="form-control form-control-sm text-end"
                    style={{ width: 60 }} />
                </label>
              ))}
            </div>
            <p className="small text-muted fst-italic mt-2 mb-0">
              I valori vengono sottratti dal totale nell&apos;export XLSX. Si azzerano ad ogni ricaricamento della pagina.
            </p>
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
