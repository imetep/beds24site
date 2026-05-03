'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getPropertyForRoom } from '@/config/properties';
import { UPSELL_TEXTS } from '@/config/upsell-items';
import type { Locale } from '@/config/i18n';
import { locales, localeLabels } from '@/config/i18n';
import { useWizardStore } from '@/store/wizard-store';
import HomeSearch from '@/components/home/HomeSearch';
import WizardStep1 from '@/components/wizard/WizardStep1';
import BookingSidebar from '@/components/wizard/BookingSidebar';

type Phase = 'search' | 'rooms' | 'preventivo';

interface UpsellRow {
  index: number;
  enabled: boolean;
  qty: number;
  unitPrice: number;
  discountPct: number;
}

export default function NuovoPreventivoPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('search');

  // Wizard store: condiviso con HomeSearch e WizardStep1
  const {
    checkIn, checkOut, numAdult, numChild, childrenAges,
    selectedRoomId, selectedOfferId, cachedOffers,
    setCheckIn, setCheckOut, setSelectedRoomId, setSelectedOfferId,
  } = useWizardStore();

  // Stato preventivo (fase 3)
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [baseDiscountPct, setBaseDiscountPct] = useState<number>(0);
  const [locale, setLocale] = useState<Locale>('it');
  const [notes, setNotes] = useState('');
  const [upsellRows, setUpsellRows] = useState<UpsellRow[]>([]);

  // Submit
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  const propertyId = useMemo(
    () => selectedRoomId ? getPropertyForRoom(selectedRoomId)?.propertyId ?? null : null,
    [selectedRoomId]
  );

  // Auth
  useEffect(() => {
    fetch('/api/admin/checkin').then(r => setAuthed(r.ok)).catch(() => setAuthed(false));
  }, []);

  // Reset wizard-store all'ingresso (evita leftover da una sessione /prenota precedente)
  useEffect(() => {
    setCheckIn('');
    setCheckOut('');
    setSelectedRoomId(null);
    setSelectedOfferId(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill basePrice quando entra in fase preventivo (dalla tariffa scelta)
  useEffect(() => {
    if (phase !== 'preventivo' || !selectedRoomId || !selectedOfferId) return;
    const roomEntry = cachedOffers.find((ro: any) => ro.roomId === selectedRoomId);
    const offer = roomEntry?.offers?.find((o: any) => o.offerId === selectedOfferId);
    if (offer && typeof offer.price === 'number') {
      setBasePrice(offer.price);
    }
  }, [phase, selectedRoomId, selectedOfferId, cachedOffers]);

  // Carica righe upsell quando cambia propertyId
  useEffect(() => {
    if (!propertyId) { setUpsellRows([]); return; }
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
  }, [propertyId]);

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
    if (!checkIn || !checkOut) { setError('Date mancanti'); return; }
    if (!selectedRoomId || !selectedOfferId || !propertyId) { setError('Seleziona camera e tariffa'); return; }
    if (typeof basePrice !== 'number' || basePrice <= 0) { setError('Prezzo base non valido'); return; }

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
          roomId: selectedRoomId,
          offerId: selectedOfferId,
          arrival: checkIn,
          departure: checkOut,
          numAdults: numAdult,
          numChildren: numChild,
          childrenAges,
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

  const upsellTexts = propertyId ? (UPSELL_TEXTS[propertyId] ?? {}) : {};

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
              <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(url)}>
                <Icon name="link-45deg" className="me-1" /> Copia
              </button>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link href={`/admin/preventivi/${createdId}`} className="btn btn-outline-primary">Vedi dettaglio</Link>
          <Link href="/admin/preventivi" className="btn btn-outline-secondary">Torna alla lista</Link>
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              setCreatedId(null); setBasePrice(''); setNotes(''); setBaseDiscountPct(0);
              setSelectedRoomId(null); setSelectedOfferId(null);
              setCheckIn(''); setCheckOut('');
              setPhase('search');
            }}
          >
            Crea un altro
          </button>
        </div>
      </div>
    );
  }

  // ─── FASE 1: HomeSearch (date + ospiti) ────────────────────────────────────
  if (phase === 'search') {
    return (
      <div className="container page-top pb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 fw-bold mb-0">
            <Icon name="file-earmark-image" className="me-2" /> Nuovo preventivo
          </h1>
          <Link href="/admin/preventivi" className="btn btn-sm btn-outline-secondary">Annulla</Link>
        </div>
        <p className="small text-muted mb-3">
          Inizia scegliendo le date e gli ospiti del preventivo (stessa interfaccia del cliente).
        </p>
        <HomeSearch locale="it" onCerca={() => setPhase('rooms')} />
      </div>
    );
  }

  // ─── FASE 2: WizardStep1 (lista case + tariffe) ────────────────────────────
  if (phase === 'rooms') {
    return (
      <div className="wizard-container">
        <div className="d-flex justify-content-between align-items-center mb-3 px-3">
          <h1 className="h5 fw-bold mb-0">
            <Icon name="file-earmark-image" className="me-2" /> Nuovo preventivo · Scegli camera
          </h1>
          <Link href="/admin/preventivi" className="btn btn-sm btn-outline-secondary">Annulla</Link>
        </div>
        <div className="wizard-container__layout">
          <div className="wizard-container__main">
            <WizardStep1
              locale="it"
              onBack={() => setPhase('search')}
              onContinua={() => setPhase('preventivo')}
            />
          </div>
          <div className="wizard-container__sidebar">
            <BookingSidebar
              locale="it"
              step={1}
              onContinua={() => setPhase('preventivo')}
              canContinua={!!selectedOfferId}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── FASE 3: form preventivo (sconto + upsell + lingua + note) ─────────────
  return (
    <div className="container page-top pb-5" style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 fw-bold mb-0">
          <Icon name="file-earmark-image" className="me-2" /> Dettagli preventivo
        </h1>
        <button onClick={() => setPhase('rooms')} className="btn btn-sm btn-outline-secondary">
          ← Cambia camera
        </button>
      </div>

      {/* Riepilogo selezione */}
      <div className="card shadow-sm mb-3 border-primary">
        <div className="card-body py-2">
          <p className="small text-muted mb-1">Camera selezionata</p>
          <p className="fw-medium mb-0">
            {checkIn} → {checkOut} · {numAdult} adulti{numChild > 0 ? `, ${numChild} bambini` : ''}
          </p>
        </div>
      </div>

      {/* Prezzo base + sconto */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <p className="small fw-bold text-muted mb-2">
            Prezzo soggiorno (precompilato dalla tariffa scelta — modificabile)
          </p>
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
                onFocus={e => e.target.select()}
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
                onFocus={e => e.target.select()}
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
                          onChange={e => updateUpsell(row.index, { qty: Math.max(1, Number(e.target.value) || 1) })}
                          onFocus={e => e.target.select()} />
                      </div>
                      <div className="col-4">
                        <label className="form-label small mb-1">Prezzo unit. €</label>
                        <input type="number" min={0} step="1" className="form-control form-control-sm" value={row.unitPrice}
                          onChange={e => updateUpsell(row.index, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                          onFocus={e => e.target.select()} />
                      </div>
                      <div className="col-4">
                        <label className="form-label small mb-1">Sconto %</label>
                        <input type="number" min={0} max={100} step="1" className="form-control form-control-sm" value={row.discountPct}
                          onChange={e => updateUpsell(row.index, { discountPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                          onFocus={e => e.target.select()} />
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
          <Icon name="exclamation-triangle-fill" className="me-2" />{error}
        </div>
      )}

      <div className="d-flex gap-2 justify-content-end">
        <button onClick={() => setPhase('rooms')} className="btn btn-outline-secondary">Indietro</button>
        <button className="btn btn-primary fw-bold" disabled={busy} onClick={submit}>
          {busy ? 'Creazione…' : 'Genera link'}
        </button>
      </div>
    </div>
  );
}
