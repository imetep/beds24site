'use client';

/**
 * OpDashboard — homepage dell'operatore loggato.
 *
 * Mostra i task assegnati raggruppati per giorno, con bottone logout
 * e link alle pagine di dettaglio. Visibilità: solo i suoi task (decisione 4).
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import type { Casa } from '@/lib/case-types';
import type { Task } from '@/lib/task-types';
import type { Ruolo } from '@/lib/operatori-types';
import { RUOLO_LABEL } from '@/lib/operatori-types';
import { calcolaCompletamento } from '@/lib/checklist-types';

interface MeResponse {
  operatore: {
    id:          string;
    username:    string;
    displayName: string;
    ruoli:       Ruolo[];
    hasTelegram: boolean;
  };
}

interface TaskWithCasa extends Task {
  casa: Casa | null;
}

const STATO_LABEL: Record<Task['stato'], { label: string; color: string }> = {
  'da-assegnare':     { label: 'Da assegnare',     color: '#6b7280' },
  'assegnato':        { label: 'Assegnato',        color: 'var(--color-primary)' },
  'in-corso':         { label: 'In corso',         color: '#0284c7' },
  'lavoro-terminato': { label: 'Lavoro terminato', color: '#ca8a04' },
  'completato':       { label: 'Completato',       color: '#16a34a' },
  'annullato':        { label: 'Annullato',        color: '#dc2626' },
};

const TIPO_LABEL: Record<Task['tipo'], string> = {
  'turnover':     'Turnover',
  'periodica':    'Intervento periodico',
  'manutenzione': 'Manutenzione',
  'accoglienza':  'Accoglienza',
  'adhoc':        'Task',
};

function fmtData(ymd: string): string {
  const d = new Date(ymd + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isOggi(ymd: string): boolean {
  return ymd === new Date().toISOString().slice(0, 10);
}

export default function OpDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse['operatore'] | null>(null);
  const [tasks, setTasks] = useState<TaskWithCasa[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [meRes, tasksRes] = await Promise.all([
        fetch('/api/op/me'),
        fetch('/api/op/turnover'),
      ]);
      if (meRes.status === 401) {
        router.replace('/op');
        return;
      }
      const meData   = await meRes.json();
      const taskData = await tasksRes.json();
      setMe(meData.operatore);
      setTasks(taskData.tasks ?? []);
    } catch {
      setError('Errore di rete');
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await fetch('/api/op/login', { method: 'DELETE' });
    router.replace('/op');
  }

  if (!authChecked) {
    return <div className="text-center text-muted py-5">Caricamento…</div>;
  }
  if (!me) {
    return null;     // redirect in corso
  }

  // Raggruppa per data
  const byData = new Map<string, TaskWithCasa[]>();
  for (const t of tasks) {
    const arr = byData.get(t.data) ?? [];
    arr.push(t);
    byData.set(t.data, arr);
  }
  const dateOrdinate = Array.from(byData.keys()).sort();

  return (
    <div className="container page-top pb-5" style={{ maxWidth: 700 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h5 fw-bold mb-0">
            <Icon name="person-fill" className="me-1" /> {me.displayName}
          </h1>
          <p className="small text-muted mb-0">
            {me.ruoli.map(r => RUOLO_LABEL[r]).join(' · ')}
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Esci</button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small">{error}</div>
      )}

      {loading && <p className="text-muted small">Caricamento task…</p>}

      {!loading && tasks.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-0">
              <Icon name="check-circle-fill" className="me-1" />
              Nessun task assegnato per i prossimi 14 giorni.
            </p>
          </div>
        </div>
      )}

      {dateOrdinate.map(data => (
        <div key={data} className="mb-4">
          <p className="small fw-bold text-uppercase text-secondary mb-2"
            style={{ letterSpacing: '0.06em' }}>
            <Icon name="calendar-event" className="me-1" />
            {isOggi(data) ? `OGGI · ${fmtData(data)}` : fmtData(data)}
          </p>

          {byData.get(data)!.map(t => {
            const completamento = t.checklist ? calcolaCompletamento(t.checklist) : null;
            const stato = STATO_LABEL[t.stato];
            return (
              <button key={t.id}
                onClick={() => router.push(`/op/turnover/${t.id}`)}
                className="card text-start border-0 shadow-sm p-3 mb-2 w-100">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="flex-fill">
                    <p className="fw-bold mb-1">
                      <span className="badge text-uppercase me-2"
                        style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-subtle)', fontSize: 10 }}>
                        {TIPO_LABEL[t.tipo]}
                      </span>
                      {t.casa?.nome ?? t.titolo}
                    </p>
                    {t.casa?.indirizzo && (
                      <p className="small text-muted mb-1">
                        <Icon name="geo-alt-fill" className="me-1" /> {t.casa.indirizzo}
                      </p>
                    )}
                    {t.descrizione && (
                      <p className="small text-secondary mb-1">{t.descrizione}</p>
                    )}
                    {completamento != null && (
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <div className="flex-fill" style={{
                          height: 6, background: 'var(--color-bg-muted)', borderRadius: 3, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${completamento}%`, height: '100%',
                            background: completamento === 100 ? '#16a34a' : 'var(--color-primary)',
                          }} />
                        </div>
                        <span className="small text-muted" style={{ minWidth: 36 }}>{completamento}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="badge" style={{ background: stato.color, color: '#fff' }}>
                      {stato.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
