'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { PROPERTIES } from '@/config/properties';
import { computeTotals, type Preventivo, type PreventivoStatus } from '@/lib/preventivo-types';

type AdminPreventivo = Preventivo & { lockTtlSec?: number };
type FilterStatus = 'all' | PreventivoStatus;

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

function roomName(roomId: number): string {
  for (const p of PROPERTIES) {
    const r = p.rooms.find(r => r.roomId === roomId);
    if (r) return r.name;
  }
  return `#${roomId}`;
}

function formatDate(ymd: string): string {
  return new Date(ymd + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtEuro(n: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function PreventiviListPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<AdminPreventivo[] | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/checkin').then(r => setAuthed(r.ok)).catch(() => setAuthed(false));
  }, []);

  function loadList() {
    if (!authed) return;
    fetch('/api/preventivi')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setItems(d.preventivi);
      })
      .catch(e => setError(e.message));
  }

  useEffect(() => { loadList(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [authed]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    window.location.href = '/admin';
  }

  async function cancellaPreventivo(id: string, status: PreventivoStatus) {
    const msg = status === 'converted'
      ? `Marcare il preventivo ${id.toUpperCase()} come annullato? La booking su Beds24 va annullata separatamente.`
      : `Eliminare definitivamente il preventivo ${id.toUpperCase()}?`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/preventivi/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Errore: ${data.error ?? 'unknown'}`);
      return;
    }
    loadList();
  }

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === 'all') return items;
    return items.filter(p => p.status === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const c: Record<FilterStatus, number> = { all: 0, active: 0, expired: 0, converted: 0, cancelled: 0 };
    if (!items) return c;
    c.all = items.length;
    for (const p of items) c[p.status]++;
    return c;
  }, [items]);

  if (authed === null) return <div className="text-center text-muted py-5">Caricamento…</div>;
  if (!authed) return (
    <div className="container page-top">
      <p>Accesso richiesto. <Link href="/admin">Vai al login</Link></p>
    </div>
  );

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h4 fw-bold mb-0">
            <Icon name="file-earmark-image" className="me-2" /> Preventivi
          </h1>
          <p className="small text-muted mb-0">Gestione offerte personalizzate</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link href="/admin/preventivi/nuovo" className="btn btn-primary btn-sm fw-bold">
            + Nuovo
          </Link>
          <a href="/admin" className="btn btn-outline-secondary btn-sm">← Admin</a>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadList}>↻ Aggiorna</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {(['all', 'active', 'expired', 'converted', 'cancelled'] as FilterStatus[]).map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Tutti' : STATUS_LABEL[s as PreventivoStatus]} <span className="badge bg-light text-dark ms-1">{counts[s]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3">
          <Icon name="exclamation-triangle-fill" className="me-2" />Errore: {error}
        </div>
      )}

      {items === null && !error && (
        <p className="text-muted">Caricamento elenco…</p>
      )}

      {items && filtered.length === 0 && (
        <div className="text-center text-muted py-5">
          <Icon name="file-earmark-image" size={48} className="opacity-50 mb-3" />
          <p className="mb-2">Nessun preventivo {filter !== 'all' ? `con stato "${STATUS_LABEL[filter as PreventivoStatus].toLowerCase()}"` : ''}.</p>
          {filter === 'all' && (
            <Link href="/admin/preventivi/nuovo" className="btn btn-primary">Crea il primo</Link>
          )}
        </div>
      )}

      {/* Lista */}
      {filtered.length > 0 && (
        <div className="d-flex flex-column gap-2">
          {filtered.map(p => {
            const totals = computeTotals(p);
            return (
              <div key={p.id} className="card shadow-sm border-0">
                <div className="card-body py-3">
                  <Link
                    href={`/admin/preventivi/${p.id}`}
                    className="text-decoration-none text-reset d-block"
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                      <div className="flex-fill">
                        <p className="fw-bold mb-1">
                          {roomName(p.roomId)}
                          <span className={`badge ${STATUS_BADGE[p.status]} ms-2`}>{STATUS_LABEL[p.status]}</span>
                          {p.lockTtlSec && p.lockTtlSec > 0 && (
                            <span className="badge bg-warning text-dark ms-2">
                              <Icon name="hourglass-split" size={12} className="me-1" />
                              Bonifico {Math.floor(p.lockTtlSec / 60).toString().padStart(2, '0')}:{(p.lockTtlSec % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </p>
                        <p className="small text-muted mb-1">
                          <Icon name="calendar-fill" size={14} className="me-1" />
                          {formatDate(p.arrival)} → {formatDate(p.departure)}
                          <span className="mx-2">·</span>
                          <Icon name="people-fill" size={14} className="me-1" />
                          {p.numAdults}{p.numChildren > 0 ? `+${p.numChildren}` : ''}
                        </p>
                        <p className="small text-muted mb-0">
                          ID <code>{p.id}</code>
                          <span className="mx-2">·</span>
                          Creato {formatDateTime(p.createdAt)}
                          {p.status === 'active' && (
                            <>
                              <span className="mx-2">·</span>
                              Scade {formatDateTime(p.expiresAt)}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>{fmtEuro(totals.total)}</p>
                        {totals.totalDiscount > 0 && (
                          <p className="small text-success mb-0">−{fmtEuro(totals.totalDiscount)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                  {/* Azioni rapide (fuori dal Link, no propagazione click) */}
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    {p.status !== 'converted' && (
                      <Link
                        href={`/admin/preventivi/nuovo?edit=${p.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <Icon name="pencil-fill" size={12} className="me-1" />
                        Modifica
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => cancellaPreventivo(p.id, p.status)}
                    >
                      <Icon name="trash" size={12} className="me-1" />
                      {p.status === 'converted' ? 'Annulla' : 'Elimina'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
