'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { PROPERTIES } from '@/config/properties';
import { UPSELL_TEXTS } from '@/config/upsell-items';
import type { Locale } from '@/config/i18n';
import { locales, localeLabels } from '@/config/i18n';

interface UpsellRow {
  index: number;
  enabled: boolean;
  qty: number;
  unitPrice: number;
  discountPct: number;
}

export default function NuovoPreventivoPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Form state
  const [propertyId, setPropertyId] = useState<number>(PROPERTIES[0].propertyId);
  const property = useMemo(
    () => PROPERTIES.find(p => p.propertyId === propertyId) ?? PROPERTIES[0],
    [propertyId]
  );
  const [roomId, setRoomId] = useState<number>(property.rooms[0].roomId);
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [baseDiscountPct, setBaseDiscountPct] = useState<number>(0);
  const [locale, setLocale] = useState<Locale>('it');
  const [notes, setNotes] = useState('');
  const [upsellRows, setUpsellRows] = useState<UpsellRow[]>([]);

  // Submit state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    fetch('/api/admin/checkin').then(r => setAuthed(r.ok)).catch(() => setAuthed(false));
  }, []);

  // Reset roomId quando cambia property + ricarica upsell rows
  useEffect(() => {
    if (!property.rooms.find(r => r.roomId === roomId)) {
      setRoomId(property.rooms[0].roomId);
    }
    const items = UPSELL_TEXTS[propertyId] ?? {};
    setUpsellRows(
      Object.keys(items).map(idxStr => ({
        index: Number(idxStr),
        enabled: false,
        qty: 1,
        unitPrice: 0,
        discountPct: 0,
      }))
    );
  }, [propertyId, property, roomId]);

  if (authed === null) {
    return <div className="text-center text-muted py-5">Caricamento…</div>;
  }
  if (!authed) {
    return (
      <div className="container page-top">
        <p>Accesso richiesto. <Link href="/admin">Vai al login</Link></p>
      </div>
    );
  }

  function updateUpsell(index: number, patch: Partial<UpsellRow>) {
    setUpsellRows(rows => rows.map(r => r.index === index ? { ...r, ...patch } : r));
  }

  async function submit() {
    setError('');
    if (!arrival || !departure) { setError('Inserisci le date'); return; }
    if (arrival >= departure) { setError('La partenza deve essere dopo l\'arrivo'); return; }
    if (typeof basePrice !== 'number' || basePrice <= 0) { setError('Inserisci un prezzo base valido'); return; }

    const upsells = upsellRows.filter(r => r.enabled).map(r => ({
      index: r.index,
      qty: r.qty,
      unitPrice: r.unitPrice,
      discountPct: r.discountPct,
    }));

    setBusy(true);
    try {
      const res = await fetch('/api/preventivi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          roomId,
          arrival,
          departure,
          numAdults,
          numChildren,
          basePrice,
          baseDiscountPct,
          upsells,
          locale,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`Errore: ${data.error ?? 'unknown'}`);
        return;
      }
      setCreatedId(data.id);
    } catch (e) {
      setError(`Errore di rete: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const upsellTexts = UPSELL_TEXTS[propertyId] ?? {};

  // ─── Schermata di successo ─────────────────────────────────────────────────
  if (createdId) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/preventivo/${createdId}`;
    return (
      <div className="container page-top pb-5" style={{ maxWidth: 720 }}>
        <h1 className="h4 fw-bold mb-3">
          <Icon name="check-circle-fill" className="me-2" /> Preventivo creato
        </h1>
        <div className="card border-success shadow-sm mb-3">
          <div className="card-body">
            <p className="small text-muted mb-1">Link per il cliente (valido 48 ore):</p>
            <div className="d-flex gap-2 align-items-center">
              <input
                readOnly
                value={url}
                className="form-control"
                onFocus={e => e.target.select()}
              />
              <button
                className="btn btn-primary"
                onClick={() => navigator.clipboard.writeText(url)}
              >
                <Icon name="link-2" className="me-1" /> Copia
              </button>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link href={`/admin/preventivi/${createdId}`} className="btn btn-outline-primary">
            Vedi dettaglio
          </Link>
          <Link href="/admin/preventivi" className="btn btn-outline-secondary">
            Torna alla lista
          </Link>
          <button
            className="btn btn-outline-secondary"
            onClick={() => { setCreatedId(null); setBasePrice(''); setNotes(''); }}
          >
            Crea un altro
          </button>
        </div>
      </div>
    );
  }

  // ─── Form principale ───────────────────────────────────────────────────────
  return (
    <div className="container page-top pb-5" style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 fw-bold mb-0">
          <Icon name="file-image" className="me-2" /> Nuovo preventivo
        </h1>
        <Link href="/admin/preventivi" className="btn btn-sm btn-outline-secondary">Annulla</Link>
      </div>

      {/* Casa + camera */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-medium">Struttura</label>
              <select
                className="form-select"
                value={propertyId}
                onChange={e => setPropertyId(Number(e.target.value))}
              >
                {PROPERTIES.map(p => (
                  <option key={p.propertyId} value={p.propertyId}>{p.name} — {p.nameShort}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small fw-medium">Camera</label>
              <select
                className="form-select"
                value={roomId}
                onChange={e => setRoomId(Number(e.target.value))}
              >
                {property.rooms.map(r => (
                  <option key={r.roomId} value={r.roomId}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Date e ospiti */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-6 col-md-3">
              <label className="form-label small fw-medium">Arrivo</label>
              <input type="date" className="form-control" value={arrival} onChange={e => setArrival(e.target.value)} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small fw-medium">Partenza</label>
              <input type="date" className="form-control" value={departure} onChange={e => setDeparture(e.target.value)} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small fw-medium">Adulti</label>
              <input type="number" min={1} className="form-control" value={numAdults} onChange={e => setNumAdults(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small fw-medium">Bambini</label>
              <input type="number" min={0} className="form-control" value={numChildren} onChange={e => setNumChildren(Math.max(0, Number(e.target.value) || 0))} />
            </div>
          </div>
        </div>
      </div>

      {/* Prezzo base + sconto */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <p className="small fw-bold text-muted mb-2">Prezzo soggiorno</p>
          <div className="row g-2">
            <div className="col-7 col-md-8">
              <label className="form-label small fw-medium">Prezzo base (€)</label>
              <input
                type="number"
                step="1"
                min={0}
                className="form-control"
                value={basePrice}
                onChange={e => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="es. 850"
              />
            </div>
            <div className="col-5 col-md-4">
              <label className="form-label small fw-medium">Sconto %</label>
              <input
                type="number"
                step="1"
                min={0}
                max={100}
                className="form-control"
                value={baseDiscountPct}
                onChange={e => setBaseDiscountPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upsell */}
      {upsellRows.length > 0 && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <p className="small fw-bold text-muted mb-2">Servizi aggiuntivi</p>
            {upsellRows.map(row => {
              const texts = upsellTexts[row.index];
              const name = texts?.name?.it ?? `Upsell #${row.index}`;
              return (
                <div key={row.index} className={`p-2 mb-2 rounded border ${row.enabled ? 'border-primary bg-light' : 'border-secondary-subtle'}`}>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`up-${row.index}`}
                      checked={row.enabled}
                      onChange={e => updateUpsell(row.index, { enabled: e.target.checked })}
                    />
                    <label className="form-check-label fw-medium" htmlFor={`up-${row.index}`}>
                      {name}
                    </label>
                  </div>
                  {row.enabled && (
                    <div className="row g-2">
                      <div className="col-4">
                        <label className="form-label small mb-1">Quantità</label>
                        <input type="number" min={1} className="form-control form-control-sm" value={row.qty}
                          onChange={e => updateUpsell(row.index, { qty: Math.max(1, Number(e.target.value) || 1) })} />
                      </div>
                      <div className="col-4">
                        <label className="form-label small mb-1">Prezzo unit. €</label>
                        <input type="number" min={0} step="1" className="form-control form-control-sm" value={row.unitPrice}
                          onChange={e => updateUpsell(row.index, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} />
                      </div>
                      <div className="col-4">
                        <label className="form-label small mb-1">Sconto %</label>
                        <input type="number" min={0} max={100} step="1" className="form-control form-control-sm" value={row.discountPct}
                          onChange={e => updateUpsell(row.index, { discountPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lingua + note */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-medium">Lingua link cliente</label>
              <select className="form-select" value={locale} onChange={e => setLocale(e.target.value as Locale)}>
                {locales.map(l => (
                  <option key={l} value={l}>{localeLabels[l]}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-8">
              <label className="form-label small fw-medium">Note interne (non mostrate al cliente)</label>
              <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3">
          <Icon name="triangle-alert" className="me-2" />{error}
        </div>
      )}

      <div className="d-flex gap-2 justify-content-end">
        <Link href="/admin/preventivi" className="btn btn-outline-secondary">Annulla</Link>
        <button className="btn btn-primary fw-bold" disabled={busy} onClick={submit}>
          {busy ? 'Creazione…' : 'Genera link'}
        </button>
      </div>
    </div>
  );
}
