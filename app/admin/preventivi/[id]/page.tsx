'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { PROPERTIES } from '@/config/properties';
import { UPSELL_TEXTS } from '@/config/upsell-items';
import { computeTotals, type Preventivo, type PreventivoStatus } from '@/lib/preventivo-types';

const STATUS_LABEL: Record<PreventivoStatus, string> = {
  active: 'Attivo',
  expired: 'Scaduto',
  converted: 'Convertito',
  cancelled: 'Annullato',
};
const STATUS_BADGE: Record<PreventivoStatus, string> = {
  active: 'bg-success',
  expired: 'bg-secondary',
  converted: 'bg-primary',
  cancelled: 'bg-danger',
};

function findRoom(roomId: number) {
  for (const p of PROPERTIES) {
    const r = p.rooms.find(r => r.roomId === roomId);
    if (r) return { property: p, room: r };
  }
  return null;
}

function fmtEuro(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

function formatDate(ymd: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function PreventivoDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [preventivo, setPreventivo] = useState<Preventivo | null | undefined>(undefined); // undefined=loading, null=not found
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/checkin').then(r => setAuthed(r.ok)).catch(() => setAuthed(false));
  }, []);

  // L'admin legge i preventivi via lista (include tutti i campi). Il GET pubblico
  // /api/preventivi/[id] è sanitizzato. Per semplicità qui ricarichiamo la lista.
  useEffect(() => {
    if (!authed) return;
    fetch('/api/preventivi')
      .then(r => r.json())
      .then(d => {
        const found = (d.preventivi as Preventivo[] | undefined)?.find(p => p.id === id);
        setPreventivo(found ?? null);
      })
      .catch(e => setError(e.message));
  }, [authed, id]);

  async function rigenera() {
    if (!preventivo) return;
    if (!confirm('Rigenerare il link? Il vecchio sarà invalidato e il nuovo durerà 48 ore.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/preventivi/${id}/rigenera`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'errore'); return; }
      router.push(`/admin/preventivi/${data.id}`);
    } finally {
      setBusy(false);
    }
  }

  async function elimina() {
    if (!preventivo) return;
    const msg = preventivo.status === 'converted'
      ? 'Marcare il preventivo come annullato? La booking su Beds24 va annullata separatamente.'
      : 'Eliminare definitivamente questo preventivo?';
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/preventivi/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'errore');
        return;
      }
      router.push('/admin/preventivi');
    } finally {
      setBusy(false);
    }
  }

  if (authed === null || preventivo === undefined) {
    return <div className="text-center text-muted py-5">Caricamento…</div>;
  }
  if (!authed) {
    return <div className="container page-top"><p>Accesso richiesto. <Link href="/admin">Vai al login</Link></p></div>;
  }
  if (preventivo === null) {
    return (
      <div className="container page-top text-center">
        <Icon name="circle-x" size={48} className="text-muted opacity-50 mb-3" />
        <p>Preventivo <code>{id}</code> non trovato (potrebbe essere scaduto e rimosso).</p>
        <Link href="/admin/preventivi" className="btn btn-outline-secondary">Torna alla lista</Link>
      </div>
    );
  }

  const p = preventivo;
  const totals = computeTotals(p);
  const found = findRoom(p.roomId);
  const property = found?.property;
  const room = found?.room;
  const upsellTexts = UPSELL_TEXTS[p.propertyId] ?? {};
  const url = typeof window !== 'undefined' ? `${window.location.origin}/${p.locale}/preventivo/${p.id}` : '';
  const canRigenera = p.status !== 'converted';
  const canEliminate = true;

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 720 }}>

      <div className="d-flex justify-content-between align-items-start mb-3 gap-2 flex-wrap">
        <div>
          <p className="small text-muted mb-1">
            <Link href="/admin/preventivi" className="text-muted">← Lista preventivi</Link>
          </p>
          <h1 className="h4 fw-bold mb-1">
            Preventivo <code>{p.id}</code>
            <span className={`badge ${STATUS_BADGE[p.status]} ms-2`}>{STATUS_LABEL[p.status]}</span>
          </h1>
          <p className="small text-muted mb-0">
            Creato {formatDateTime(p.createdAt)}
            {p.status === 'active' && <> · Scade {formatDateTime(p.expiresAt)}</>}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3">
          <Icon name="triangle-alert" className="me-2" />Errore: {error}
        </div>
      )}

      {/* Link cliente */}
      {p.status !== 'cancelled' && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <p className="small fw-bold text-muted mb-2">Link per il cliente</p>
            <div className="d-flex gap-2 align-items-center">
              <input readOnly value={url} className="form-control form-control-sm" onFocus={e => e.target.select()} />
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigator.clipboard.writeText(url)}
              >
                <Icon name="link-2" className="me-1" /> Copia
              </button>
              <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                <Icon name="arrow-up-right" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Riepilogo */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <p className="small text-muted mb-1">Struttura</p>
              <p className="fw-medium mb-0">{property?.name ?? `Property ${p.propertyId}`}</p>
            </div>
            <div className="col-12 col-md-6">
              <p className="small text-muted mb-1">Camera</p>
              <p className="fw-medium mb-0">{room?.name ?? `Room ${p.roomId}`}</p>
            </div>
            <div className="col-12 col-md-6">
              <p className="small text-muted mb-1">Date</p>
              <p className="fw-medium mb-0">{formatDate(p.arrival)} → {formatDate(p.departure)}</p>
            </div>
            <div className="col-12 col-md-6">
              <p className="small text-muted mb-1">Ospiti</p>
              <p className="fw-medium mb-0">{p.numAdults} adulti{p.numChildren > 0 ? `, ${p.numChildren} bambini` : ''}</p>
            </div>
            <div className="col-12 col-md-6">
              <p className="small text-muted mb-1">Lingua link</p>
              <p className="fw-medium mb-0">{p.locale.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dettaglio prezzi */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <p className="small fw-bold text-muted mb-2">Prezzi</p>

          <div className="d-flex justify-content-between py-1">
            <span>Soggiorno</span>
            <span>
              {p.baseDiscountPct > 0 && (
                <span className="text-muted text-decoration-line-through me-2">{fmtEuro(totals.baseGross)}</span>
              )}
              {fmtEuro(totals.baseNet)}
            </span>
          </div>
          {p.baseDiscountPct > 0 && (
            <div className="d-flex justify-content-between py-1 small text-success">
              <span>↳ Sconto {p.baseDiscountPct}%</span>
              <span>−{fmtEuro(totals.baseDiscount)}</span>
            </div>
          )}

          {p.upsells.map(u => {
            const lineGross = u.unitPrice * u.qty;
            const lineDiscount = lineGross * (u.discountPct / 100);
            const lineNet = lineGross - lineDiscount;
            const name = upsellTexts[u.index]?.name?.it ?? `Upsell #${u.index}`;
            return (
              <div key={u.index}>
                <div className="d-flex justify-content-between py-1">
                  <span>{name} <span className="text-muted small">×{u.qty}</span></span>
                  <span>
                    {u.discountPct > 0 && (
                      <span className="text-muted text-decoration-line-through me-2">{fmtEuro(lineGross)}</span>
                    )}
                    {fmtEuro(lineNet)}
                  </span>
                </div>
                {u.discountPct > 0 && (
                  <div className="d-flex justify-content-between py-1 small text-success">
                    <span>↳ Sconto {u.discountPct}%</span>
                    <span>−{fmtEuro(lineDiscount)}</span>
                  </div>
                )}
              </div>
            );
          })}

          <hr className="my-2" />
          <div className="d-flex justify-content-between fw-bold">
            <span>Totale</span>
            <span style={{ color: 'var(--color-primary)' }}>{fmtEuro(totals.total)}</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="d-flex justify-content-between small text-success">
              <span>Risparmio totale</span>
              <span>−{fmtEuro(totals.totalDiscount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Note interne */}
      {p.notes && (
        <div className="card shadow-sm mb-3 border-warning">
          <div className="card-body">
            <p className="small fw-bold text-muted mb-1">
              <Icon name="sticky-note" className="me-1" /> Note interne (non mostrate al cliente)
            </p>
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{p.notes}</p>
          </div>
        </div>
      )}

      {/* Cliente (se ha già iniziato il pagamento) */}
      {(p.customerName || p.customerEmail || p.paymentMethodChosen || p.bookingId) && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <p className="small fw-bold text-muted mb-2">Cliente</p>
            {p.customerName && <p className="mb-1"><strong>Nome:</strong> {p.customerName}</p>}
            {p.customerEmail && <p className="mb-1"><strong>Email:</strong> {p.customerEmail}</p>}
            {p.paymentMethodChosen && <p className="mb-1"><strong>Metodo:</strong> {p.paymentMethodChosen}</p>}
            {p.bookingId && <p className="mb-0"><strong>Booking Beds24:</strong> #{p.bookingId}</p>}
          </div>
        </div>
      )}

      {/* Azioni */}
      <div className="d-flex gap-2 justify-content-end flex-wrap">
        {canRigenera && (
          <button className="btn btn-outline-primary" onClick={rigenera} disabled={busy}>
            <Icon name="rotate-cw" className="me-1" /> Rigenera link (48h)
          </button>
        )}
        {canEliminate && (
          <button className="btn btn-outline-danger" onClick={elimina} disabled={busy}>
            <Icon name="trash-2" className="me-1" /> {p.status === 'converted' ? 'Marca annullato' : 'Elimina'}
          </button>
        )}
      </div>
    </div>
  );
}
