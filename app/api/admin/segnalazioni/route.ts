/**
 * /api/admin/segnalazioni
 *
 * GET ?stato=aperta|in-triage|task-creato|risolta|ignorata
 *     ?gravita=Critica|Alta|Media|Bassa
 *     ?casaId=xxx
 *   → lista segnalazioni filtrate, default: aperte+in-triage (Inbox).
 *     Arricchite con info casa e operatore segnalante.
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listSegnalazioniAperte,
  listSegnalazioni,
} from '@/lib/segnalazioni-kv';
import { listCase } from '@/lib/case-kv';
import { listOperatori } from '@/lib/operatori-kv';
import {
  STATI_SEGNALAZIONE,
  GRAVITA,
  type StatoSegnalazione,
  type Gravita,
} from '@/lib/segnalazioni-types';

export const runtime = 'nodejs';

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const statoParam   = sp.get('stato');
  const gravitaParam = sp.get('gravita');
  const casaId       = sp.get('casaId') ?? undefined;

  let stato: StatoSegnalazione | StatoSegnalazione[] | undefined = undefined;
  if (statoParam) {
    const stati = statoParam.split(',').filter(s => (STATI_SEGNALAZIONE as readonly string[]).includes(s));
    stato = stati.length === 1 ? stati[0] as StatoSegnalazione : stati as StatoSegnalazione[];
  }

  let gravita: Gravita | Gravita[] | undefined = undefined;
  if (gravitaParam) {
    const grv = gravitaParam.split(',').filter(g => (GRAVITA as readonly string[]).includes(g));
    gravita = grv.length === 1 ? grv[0] as Gravita : grv as Gravita[];
  }

  let raw;
  if (!stato && !gravita && !casaId) {
    raw = await listSegnalazioniAperte();
  } else {
    raw = await listSegnalazioni({ stato, gravita, casaId });
  }

  // Arricchisco
  const [allCase, allOps] = await Promise.all([listCase(true), listOperatori()]);
  const casaMap = new Map(allCase.map(c => [c.id, { id: c.id, nome: c.nome, beds24RoomId: c.beds24RoomId }]));
  const opMap   = new Map(allOps.map(o => [o.id, { id: o.id, displayName: o.displayName, ruoli: o.ruoli }]));

  const enriched = raw.map(s => ({
    ...s,
    casa:        casaMap.get(s.casaId)        ?? null,
    segnalataDa: opMap.get(s.segnalataDa)     ?? null,
  }));

  return NextResponse.json({ segnalazioni: enriched });
}
