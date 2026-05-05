/**
 * /api/admin/checklist
 *
 *   GET                                  → stato master per ogni ruolo
 *   POST   multipart/form-data file+ruolo → parse xlsx + sostituisce master
 *   DELETE ?ruolo=pulizie                 → cancella master di un ruolo
 *
 * Auth: cookie admin_session = ADMIN_PASSWORD.
 *
 * POST body: FormData con campi:
 *   - file:  File (xlsx, max 5 MB)
 *   - ruolo: 'pulizie' | 'manutentore' | 'giardiniere' | 'receptionist'
 *
 * Risposta POST:
 *   { master, errors, warnings }
 *   - errors non vuoto → master non salvata, status 400
 *   - errors vuoto    → master salvata, status 200, warnings opzionali
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  saveChecklistMaster,
  getAllChecklistMasters,
  deleteChecklistMaster,
} from '@/lib/checklist-kv';
import { parseChecklistXlsx } from '@/lib/checklist-xlsx';
import { RUOLI, type Ruolo } from '@/lib/operatori-types';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function isAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const masters = await getAllChecklistMasters();
  // Includi solo metadati nel listing (non le voci complete) per peso ridotto
  const summary: Record<string, {
    ruolo:        Ruolo;
    voci:         number;
    importedAt:   number | null;
    importedFrom: string | null;
  }> = {};
  for (const r of RUOLI) {
    const m = masters[r];
    summary[r] = {
      ruolo:        r,
      voci:         m?.voci.length ?? 0,
      importedAt:   m?.importedAt ?? null,
      importedFrom: m?.importedFrom ?? null,
    };
  }
  return NextResponse.json({ summary });
}

// ─── POST upload ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'multipart/form-data atteso' }, { status: 400 });
  }

  const file  = formData.get('file');
  const ruolo = formData.get('ruolo');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" mancante o non valido' }, { status: 400 });
  }
  if (typeof ruolo !== 'string' || !(RUOLI as readonly string[]).includes(ruolo)) {
    return NextResponse.json({ error: `Ruolo non valido. Ammessi: ${RUOLI.join(', ')}` }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File vuoto' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({
      error: `File troppo grande (${file.size} byte, max ${MAX_FILE_BYTES})`,
    }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = parseChecklistXlsx(arrayBuffer, ruolo as Ruolo, file.name);

  if (!result.master || result.errors.length > 0) {
    return NextResponse.json({
      master:   null,
      errors:   result.errors,
      warnings: result.warnings,
    }, { status: 400 });
  }

  await saveChecklistMaster(result.master);

  return NextResponse.json({
    master:   {
      ruolo:        result.master.ruolo,
      voci:         result.master.voci.length,
      importedAt:   result.master.importedAt,
      importedFrom: result.master.importedFrom,
    },
    errors:   [],
    warnings: result.warnings,
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const ruolo = req.nextUrl.searchParams.get('ruolo');
  if (!ruolo || !(RUOLI as readonly string[]).includes(ruolo)) {
    return NextResponse.json({ error: 'Param ?ruolo richiesto' }, { status: 400 });
  }
  await deleteChecklistMaster(ruolo as Ruolo);
  return NextResponse.json({ ok: true });
}
