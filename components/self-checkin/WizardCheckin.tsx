'use client';
import { useState, useRef } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

// ─── Tipi ─────────────────────────────────────────────────────────────────────
interface BookingInfo {
  bookId:    number;
  roomName:  string;
  checkIn:   string;
  checkOut:  string;
  numAdult:  number;
  guestName: string;
  status:    string;
}

interface Capogruppo {
  lastName:      string;
  firstName:     string;
  email:         string;
  birthDate:     string;
  gender:        string;
  birthPlace:    string;
  citizenship:   string;
  docType:       string;
  docNumber:     string;
  docIssuePlace: string;
}

interface OspiteAltro {
  guestType:   string;
  lastName:    string;
  firstName:   string;
  birthDate:   string;
  gender:      string;
  birthPlace:  string;
  citizenship: string;
}

interface DocUpload {
  label:     string;
  publicId:  string;
  preview:   string;
  uploading: boolean;
  error:     string;
}

// ─── Traduzioni ───────────────────────────────────────────────────────────────
function useT(locale: Locale) {
  return getTranslations(locale).components.wizardCheckin;
}

// Helper: riga a due colonne responsive
function Row({ children }: { children: React.ReactNode }) {
  return <div className="form-row">{children}</div>;
}

// Helper: separatore sezione
function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="section-header section-header--with-border">
      <i className={`bi ${icon} section-header__icon`} aria-hidden="true" />
      <span className="section-header__label-up">{label}</span>
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function WizardCheckin({ locale }: { locale: Locale }) {
  const t = useT(locale);
  const [step, setStep]               = useState(1);
  const [bookIdInput, setBookIdInput] = useState('');
  const [booking, setBooking]         = useState<BookingInfo | null>(null);
  const [verifying, setVerifying]     = useState(false);
  const [verifyErr, setVerifyErr]     = useState('');

  const [capo, setCapo] = useState<Capogruppo>({
    lastName: '', firstName: '', email: '', birthDate: '', gender: 'M',
    birthPlace: '', citizenship: '', docType: 'passport',
    docNumber: '', docIssuePlace: '',
  });
  const [altri, setAltri] = useState<OspiteAltro[]>([]);

  // Docs capogruppo: front + back
  const [docs, setDocs] = useState<DocUpload[]>([
    { label: 'capogruppo_front', publicId: '', preview: '', uploading: false, error: '' },
    { label: 'capogruppo_back',  publicId: '', preview: '', uploading: false, error: '' },
  ]);
  // Docs altri ospiti: solo front, uno per ospite
  const [altriDocs, setAltriDocs] = useState<DocUpload[]>([]);

  const [consentTulps, setTulps]    = useState(false);
  const [consentGdpr, setGdpr]      = useState(false);
  const [signature, setSignature]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr]   = useState('');
  const [done, setDone]             = useState(false);

  // ── Step 1 ────────────────────────────────────────────────────────────────
  async function verifyBooking() {
    const id = bookIdInput.trim();
    if (!id) return;
    setVerifying(true); setVerifyErr('');
    try {
      const res  = await fetch(`/api/booking-info?bookId=${id}`);
      const data = await res.json();
      if (!res.ok || !data.ok) { setVerifyErr(t.notFound); return; }
      const bk: BookingInfo = data.booking;
      if (!['new', 'confirmed', 'paid'].includes(bk.status)) {
        setVerifyErr(`${t.notConfirmed}${bk.status})`); return;
      }
      setBooking(bk);
      if (bk.guestName) {
        const p = bk.guestName.split(' ');
        setCapo(c => ({ ...c, firstName: p[0] ?? '', lastName: p.slice(1).join(' ') ?? '' }));
      }
    } catch { setVerifyErr(t.notFound); }
    finally { setVerifying(false); }
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const [step2Errors, setStep2Errors] = useState<string[]>([]);

  function tryStep3() {
    const errors: string[] = [];
    if (!capo.lastName)      errors.push(t.lastName);
    if (!capo.firstName)     errors.push(t.firstName);
    if (!capo.email || !capo.email.includes('@')) errors.push(t.emailLabel);
    if (!capo.birthDate)     errors.push(t.birthDate);
    if (!capo.birthPlace)    errors.push(t.birthPlace);
    if (!capo.citizenship)   errors.push(t.citizenship);
    if (!capo.docNumber)     errors.push(t.docNumber);
    if (!capo.docIssuePlace) errors.push(t.docIssuePlace);
    if (!validateAltri())    errors.push(t.otherGuests);
    if (errors.length > 0) { setStep2Errors(errors); return; }
    setStep2Errors([]);
    setStep(3);
  }
  const validateAltri = () => altri.every(a =>
    a.guestType && a.lastName && a.firstName && a.birthDate && a.gender && a.birthPlace && a.citizenship
  );
  const updA = (idx: number, f: keyof OspiteAltro, v: string) =>
    setAltri(p => p.map((a, i) => i === idx ? { ...a, [f]: v } : a));

  function addAltro() {
    setAltri(p => [...p, { guestType: 'familiare', lastName: '', firstName: '', birthDate: '', gender: 'M', birthPlace: '', citizenship: '' }]);
    setAltriDocs(p => [...p, { label: `altro_${altri.length}_front`, publicId: '', preview: '', uploading: false, error: '' }]);
  }

  function removeAltro(idx: number) {
    setAltri(p => p.filter((_, i) => i !== idx));
    setAltriDocs(p => p.filter((_, i) => i !== idx));
  }

  // ── Step 3 ────────────────────────────────────────────────────────────────
  async function uploadDoc(idx: number, file: File) {
    setDocs(d => d.map((x, i) => i === idx ? { ...x, uploading: true, error: '' } : x));
    try {
      const preview = URL.createObjectURL(file);
      const fd = new FormData();
      fd.append('file', file); fd.append('bookId', String(booking!.bookId)); fd.append('label', docs[idx].label);
      const res = await fetch('/api/checkin/upload', { method: 'POST', body: fd });
      const d   = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error ?? 'Upload fallito');
      setDocs(docs => docs.map((x, i) => i === idx ? { ...x, uploading: false, publicId: d.publicId, preview } : x));
    } catch {
      setDocs(docs => docs.map((x, i) => i === idx ? { ...x, uploading: false, error: t.uploadErr } : x));
    }
  }

  async function uploadAltroDoc(idx: number, file: File) {
    setAltriDocs(d => d.map((x, i) => i === idx ? { ...x, uploading: true, error: '' } : x));
    try {
      const preview = URL.createObjectURL(file);
      const fd = new FormData();
      fd.append('file', file); fd.append('bookId', String(booking!.bookId)); fd.append('label', `altro_${idx}_front`);
      const res = await fetch('/api/checkin/upload', { method: 'POST', body: fd });
      const d   = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error ?? 'Upload fallito');
      setAltriDocs(docs => docs.map((x, i) => i === idx ? { ...x, uploading: false, publicId: d.publicId, preview } : x));
    } catch {
      setAltriDocs(docs => docs.map((x, i) => i === idx ? { ...x, uploading: false, error: t.uploadErr } : x));
    }
  }

  const validateDocs = () =>
    docs.every(d => d.publicId !== '') &&
    altriDocs.every(d => d.publicId !== '');

  // ── Step 4 ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!signature.trim() || !consentTulps || !consentGdpr) return;
    setSubmitting(true); setSubmitErr('');
    try {
      const allDocs = [
        ...docs.filter(d => d.publicId).map(d => ({ label: d.label, publicId: d.publicId })),
        ...altriDocs.filter(d => d.publicId).map(d => ({ label: d.label, publicId: d.publicId })),
      ];
      const res = await fetch('/api/checkin/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: booking!.bookId, roomName: booking!.roomName,
          checkIn: booking!.checkIn, checkOut: booking!.checkOut,
          capogruppo: capo, altri,
          docs: allDocs,
          signature: signature.trim(), consentTulps, consentGdpr,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Errore server');
      setDone(true);
    } catch (err: any) { setSubmitErr(err.message ?? t.errorGeneric); }
    finally { setSubmitting(false); }
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  const Bar = () => (
    <div className="checkin-wizard__progress">
      <div className="checkin-wizard__progress-row">
        <span>Step {step} {t.stepOf} 4</span><span>{Math.round((step / 4) * 100)}%</span>
      </div>
      <div className="checkin-wizard__progress-bar">
        {/* Width dinamico calcolato a runtime — eccezione style legittima */}
        <div className="checkin-wizard__progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
    </div>
  );

  // ─── COMPLETATO ───────────────────────────────────────────────────────────
  if (done) {
    const isEn = locale === 'en';
    const statusUrl = `/it/self-checkin/wizard/status?bookId=${booking!.bookId}`;
    const steps = isEn ? [
      { icon: 'bi-envelope-fill',       title: 'Deposit link incoming', text: "You will shortly receive an email with the link to authorize the security deposit. Check your inbox (and spam)." },
      { icon: 'bi-search',              title: 'Document review',       text: 'We will verify your documents within 24 hours.' },
      { icon: 'bi-check-circle-fill',   title: 'Approval email',        text: 'You will receive a confirmation email with the outcome of your request.' },
    ] : [
      { icon: 'bi-envelope-fill',       title: 'Link deposito in arrivo', text: "A breve riceverai un'email con il link per autorizzare il deposito cauzionale. Controlla la casella (e lo spam)." },
      { icon: 'bi-search',              title: 'Verifica documenti',      text: 'Verificheremo i tuoi documenti entro 24 ore.' },
      { icon: 'bi-check-circle-fill',   title: 'Email di approvazione',   text: "Riceverai una email con l'esito della tua richiesta." },
    ];
    return (
      <div className="page-container page-top pb-5">
        <div className="text-center mb-4">
          <div className="checkin-wizard__done-icon">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
          </div>
          <h1 className="checkin-wizard__done-title">
            {isEn ? 'Request submitted' : 'Richiesta inviata'}
          </h1>
          <div className="checkin-wizard__done-ref">
            <p className="checkin-wizard__done-ref-text">
              {isEn ? 'Booking reference' : 'Riferimento prenotazione'}: <strong>#{booking!.bookId}</strong>
            </p>
          </div>
        </div>
        <div className="checkin-wizard__steps">
          <p className="checkin-wizard__steps-title">
            {isEn ? 'What happens next' : 'Cosa succede adesso'}
          </p>
          {steps.map((s, i) => (
            <div key={i} className="checkin-wizard__steps-row">
              <div className="checkin-wizard__steps-icon">
                <i className={`bi ${s.icon}`} aria-hidden="true" />
              </div>
              <div>
                <p className="checkin-wizard__steps-text-title">{s.title}</p>
                <p className="checkin-wizard__steps-text-body">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="checkin-wizard__track">
          <p className="checkin-wizard__track-title">
            {isEn ? 'Track your request' : 'Segui la tua richiesta'}
          </p>
          <p className="checkin-wizard__track-text">
            {isEn ? 'Check the status and send us messages at any time:' : 'Controlla lo stato e scrivici in qualsiasi momento:'}
          </p>
          <a href={statusUrl} className="checkin-wizard__track-cta">
            {isEn ? 'Go to my request →' : 'Vai alla mia richiesta →'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pb-5 checkin-wizard">

      {/* ── STEP 1 ────────────────────────────────────────────────────────── */}
      {step === 1 && (<>
        <Bar />
        <div className="checkin-wizard__step">
          <h1 className="checkin-wizard__title">{t.step1Title}</h1>
          <p className="checkin-wizard__sub">{t.step1Sub}</p>
          <div className="form-row__full">
            <label className="ui-field-label ui-field-label--uppercase">{t.bookIdLabel}</label>
            <input className="ui-field-input" type="number" inputMode="numeric" placeholder={t.bookIdPh}
              tabIndex={1}
              value={bookIdInput}
              onChange={e => { setBookIdInput(e.target.value); setVerifyErr(''); setBooking(null); }}
              onKeyDown={e => e.key === 'Enter' && verifyBooking()} />
          </div>
          {verifyErr && <p className="checkin-wizard__inline-error">{verifyErr}</p>}
          {booking ? (<>
            <div className="checkin-wizard__found">
              <p className="checkin-wizard__found-title">
                <i className="bi bi-check-lg me-1" aria-hidden="true" />
                {t.foundTitle}
              </p>
              <p className="checkin-wizard__found-line">{t.propLabel}: <strong>{booking.roomName}</strong></p>
              <p className="checkin-wizard__found-line">{t.checkinLabel}: <strong>{booking.checkIn}</strong> — {t.checkoutLabel}: <strong>{booking.checkOut}</strong></p>
              <p className="checkin-wizard__found-line">{t.guestsLabel}: <strong>{booking.numAdult}</strong></p>
            </div>
            <button className="checkin-wizard__primary-btn" onClick={() => setStep(2)} tabIndex={2}>{t.continueBtn}</button>
          </>) : (
            <button
              className={`checkin-wizard__primary-btn ${verifying || !bookIdInput.trim() ? 'is-loading' : ''}`}
              onClick={verifyBooking} disabled={verifying || !bookIdInput.trim()} tabIndex={2}>
              {verifying ? t.verifying : t.verifyBtn}
            </button>
          )}
        </div>
      </>)}

      {/* ── STEP 2 ────────────────────────────────────────────────────────── */}
      {step === 2 && (<>
        <Bar />
        <div className="checkin-wizard__step">
          <h1 className="checkin-wizard__title">{t.step2Title}</h1>
          <p className="checkin-wizard__sub">{t.step2Sub}</p>

          {/* ── Capogruppo ── */}
          <SectionHeader label={t.mainGuest} icon="bi-person-fill" />

          <Row>
            <div className="form-row__half">
              <label className="ui-field-label ui-field-label--uppercase">{t.lastName} *</label>
              <input className="ui-field-input" tabIndex={1} value={capo.lastName}
                onChange={e => setCapo(c => ({ ...c, lastName: e.target.value }))} />
            </div>
            <div className="form-row__half">
              <label className="ui-field-label ui-field-label--uppercase">{t.firstName} *</label>
              <input className="ui-field-input" tabIndex={2} value={capo.firstName}
                onChange={e => setCapo(c => ({ ...c, firstName: e.target.value }))} />
            </div>
          </Row>

          <div className="form-row__full">
            <label className="ui-field-label ui-field-label--uppercase">{t.emailLabel} *</label>
            <input className="ui-field-input" type="email" inputMode="email" placeholder={t.emailPh}
              tabIndex={3} value={capo.email}
              onChange={e => setCapo(c => ({ ...c, email: e.target.value }))} />
            <div className="checkin-wizard__email-note">
              <p className="checkin-wizard__email-note-text">
                <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                {t.emailNote}
              </p>
            </div>
          </div>

          <Row>
            <div className="form-row__half">
              <label className="ui-field-label ui-field-label--uppercase">{t.birthDate} *</label>
              <input className="ui-field-input" type="date" tabIndex={4} value={capo.birthDate}
                onChange={e => setCapo(c => ({ ...c, birthDate: e.target.value }))} />
            </div>
            <div className="form-row__half">
              <label className="ui-field-label ui-field-label--uppercase">{t.gender} *</label>
              <select className="ui-field-input ui-field-input--select-native" tabIndex={5} value={capo.gender}
                onChange={e => setCapo(c => ({ ...c, gender: e.target.value }))}>
                <option value="M">{t.male}</option>
                <option value="F">{t.female}</option>
              </select>
            </div>
          </Row>

          <div className="form-row__full">
            <label className="ui-field-label ui-field-label--uppercase">{t.birthPlace} *</label>
            <input className="ui-field-input" tabIndex={6} value={capo.birthPlace}
              onChange={e => setCapo(c => ({ ...c, birthPlace: e.target.value }))} />
          </div>

          <div className="form-row__full">
            <label className="ui-field-label ui-field-label--uppercase">{t.citizenship} *</label>
            <input className="ui-field-input" tabIndex={7} value={capo.citizenship}
              onChange={e => setCapo(c => ({ ...c, citizenship: e.target.value }))} />
          </div>

          <Row>
            <div className="form-row__half">
              <label className="ui-field-label ui-field-label--uppercase">{t.docType} *</label>
              <select className="ui-field-input ui-field-input--select-native" tabIndex={8} value={capo.docType}
                onChange={e => setCapo(c => ({ ...c, docType: e.target.value }))}>
                <option value="passport">{t.passport}</option>
                <option value="id_card">{t.idCard}</option>
                <option value="license">{t.license}</option>
              </select>
            </div>
            <div className="form-row__half">
              <label className="ui-field-label ui-field-label--uppercase">{t.docNumber} *</label>
              <input className="ui-field-input" tabIndex={9} value={capo.docNumber}
                onChange={e => setCapo(c => ({ ...c, docNumber: e.target.value }))} />
            </div>
          </Row>

          <div className="form-row__full form-row__full--mb-lg">
            <label className="ui-field-label ui-field-label--uppercase">{t.docIssuePlace} *</label>
            <input className="ui-field-input" tabIndex={10} value={capo.docIssuePlace}
              onChange={e => setCapo(c => ({ ...c, docIssuePlace: e.target.value }))} />
          </div>

          {/* ── Altri ospiti ── */}
          {altri.length > 0 && (
            <SectionHeader label={t.otherGuests} icon="bi-people-fill" />
          )}

          {altri.map((a, idx) => (
            <div key={idx} className="checkin-wizard__altro">
              <div className="checkin-wizard__altro-header">
                <span className="checkin-wizard__altro-label">{t.guestN} {idx + 2}</span>
                <button className="checkin-wizard__remove-btn" onClick={() => removeAltro(idx)}>{t.removeGuest}</button>
              </div>
              <div className="form-row__full">
                <label className="ui-field-label ui-field-label--uppercase">{t.guestType} *</label>
                <select className="ui-field-input ui-field-input--select-native" value={a.guestType}
                  onChange={e => updA(idx, 'guestType', e.target.value)}>
                  <option value="familiare">{t.familiare}</option>
                  <option value="amico">{t.amico}</option>
                </select>
              </div>
              <Row>
                <div className="form-row__half">
                  <label className="ui-field-label ui-field-label--uppercase">{t.lastName} *</label>
                  <input className="ui-field-input" value={a.lastName} onChange={e => updA(idx, 'lastName', e.target.value)} />
                </div>
                <div className="form-row__half">
                  <label className="ui-field-label ui-field-label--uppercase">{t.firstName} *</label>
                  <input className="ui-field-input" value={a.firstName} onChange={e => updA(idx, 'firstName', e.target.value)} />
                </div>
              </Row>
              <Row>
                <div className="form-row__half">
                  <label className="ui-field-label ui-field-label--uppercase">{t.birthDate} *</label>
                  <input className="ui-field-input" type="date" value={a.birthDate} onChange={e => updA(idx, 'birthDate', e.target.value)} />
                </div>
                <div className="form-row__half">
                  <label className="ui-field-label ui-field-label--uppercase">{t.gender} *</label>
                  <select className="ui-field-input ui-field-input--select-native" value={a.gender} onChange={e => updA(idx, 'gender', e.target.value)}>
                    <option value="M">{t.male}</option>
                    <option value="F">{t.female}</option>
                  </select>
                </div>
              </Row>
              <div className="form-row__full">
                <label className="ui-field-label ui-field-label--uppercase">{t.birthPlace} *</label>
                <input className="ui-field-input" value={a.birthPlace} onChange={e => updA(idx, 'birthPlace', e.target.value)} />
              </div>
              <div className="form-row__full form-row__full--mb-0">
                <label className="ui-field-label ui-field-label--uppercase">{t.citizenship} *</label>
                <input className="ui-field-input" value={a.citizenship} onChange={e => updA(idx, 'citizenship', e.target.value)} />
              </div>
            </div>
          ))}

          <button className="checkin-wizard__add-guest" onClick={addAltro}>
            {t.addGuest}
          </button>

          {step2Errors.length > 0 && (
            <div className="checkin-wizard__errors">
              <p className="checkin-wizard__errors-title">Campi mancanti:</p>
              <ul className="checkin-wizard__errors-list">
                {step2Errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <div className="checkin-wizard__nav">
            <button className="checkin-wizard__secondary-btn checkin-wizard__nav-back" onClick={() => setStep(1)}>{t.back}</button>
            <button className="checkin-wizard__primary-btn checkin-wizard__nav-next" onClick={tryStep3}>{t.continueBtn}</button>
          </div>
        </div>
      </>)}

      {/* ── STEP 3 ────────────────────────────────────────────────────────── */}
      {step === 3 && (<>
        <Bar />
        <div className="checkin-wizard__step">
          <h1 className="checkin-wizard__title">{t.step3Title}</h1>
          <p className="checkin-wizard__sub">{t.step3Sub}</p>

          <div className="checkin-wizard__gdpr-warn">
            <p className="checkin-wizard__gdpr-warn-title">
              <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
              {t.docWarning}
            </p>
            <p className="checkin-wizard__gdpr-warn-text">{t.gdprNote}</p>
          </div>

          {/* Capogruppo docs */}
          <SectionHeader label={`${capo.lastName} ${capo.firstName}`} icon="bi-person-fill" />
          <div className="checkin-wizard__doc-grid">
            {docs.map((doc, idx) => (
              <div key={doc.label} className="checkin-wizard__doc-cell">
                <DocSlot doc={doc}
                  side={doc.label.endsWith('_front') ? t.frontLabel : t.backLabel}
                  onFile={f => uploadDoc(idx, f)}
                  uploadTxt={t.uploadBtn} uploadingTxt={t.uploading} uploadedTxt={t.uploaded} />
              </div>
            ))}
          </div>

          {/* Altri ospiti docs */}
          {altri.map((a, idx) => (
            <div key={idx}>
              <SectionHeader label={`${a.lastName} ${a.firstName}`} icon="bi-person-fill" />
              <div className="checkin-wizard__doc-grid">
                {altriDocs[idx] && (
                  <div className="checkin-wizard__doc-cell">
                    <DocSlot doc={altriDocs[idx]}
                      side={t.frontLabel}
                      onFile={f => uploadAltroDoc(idx, f)}
                      uploadTxt={t.uploadBtn} uploadingTxt={t.uploading} uploadedTxt={t.uploaded} />
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="checkin-wizard__nav">
            <button className="checkin-wizard__secondary-btn checkin-wizard__nav-back" onClick={() => setStep(2)}>{t.back}</button>
            <button
              className={`checkin-wizard__primary-btn checkin-wizard__nav-next ${validateDocs() ? '' : 'is-disabled'}`}
              onClick={() => validateDocs() && setStep(4)} disabled={!validateDocs()}>{t.continueBtn}</button>
          </div>
        </div>
      </>)}

      {/* ── STEP 4 ────────────────────────────────────────────────────────── */}
      {step === 4 && (<>
        <Bar />
        <div className="checkin-wizard__step">
          <h1 className="checkin-wizard__title">{t.step4Title}</h1>
          <p className="checkin-wizard__sub">{t.step4Sub}</p>

          {/* Riepilogo */}
          <div className="checkin-wizard__summary">
            <p className="checkin-wizard__summary-title">{t.summaryTitle}</p>
            <p className="checkin-wizard__summary-line">{t.propLabel}: <strong>{booking!.roomName}</strong></p>
            <p className="checkin-wizard__summary-line checkin-wizard__summary-line--mb">{t.checkinLabel}: <strong>{booking!.checkIn}</strong> → <strong>{booking!.checkOut}</strong></p>
            <p className="checkin-wizard__summary-section">{t.summaryCapo}</p>
            <p className="checkin-wizard__summary-line checkin-wizard__summary-line--strong">{capo.lastName} {capo.firstName} — {capo.docType} {capo.docNumber}</p>
            {altri.length > 0 && (<>
              <p className="checkin-wizard__summary-section">{t.summaryOspiti}</p>
              {altri.map((a, i) => (
                <p key={i} className="checkin-wizard__summary-line">
                  {a.lastName} {a.firstName} ({(t as any)[a.guestType] ?? a.guestType})
                </p>
              ))}
            </>)}
          </div>

          <label className="checkin-wizard__consent">
            <input type="checkbox" checked={consentTulps} onChange={e => setTulps(e.target.checked)} className="checkin-wizard__consent-input" />
            <span className="checkin-wizard__consent-text">{t.consentTulps} *</span>
          </label>
          <label className="checkin-wizard__consent checkin-wizard__consent--last">
            <input type="checkbox" checked={consentGdpr} onChange={e => setGdpr(e.target.checked)} className="checkin-wizard__consent-input" />
            <span className="checkin-wizard__consent-text">{t.consentGdpr} *</span>
          </label>

          <div className="form-row__full">
            <label className="ui-field-label ui-field-label--uppercase">{t.signLabel} *</label>
            <input className="ui-field-input" value={signature} onChange={e => setSignature(e.target.value)} placeholder={t.signPh} />
          </div>

          {submitErr && <p className="checkin-wizard__inline-error">{submitErr}</p>}

          <div className="checkin-wizard__nav">
            <button className="checkin-wizard__secondary-btn checkin-wizard__nav-back" onClick={() => setStep(3)} disabled={submitting}>{t.back}</button>
            <button
              className={`checkin-wizard__primary-btn checkin-wizard__nav-next ${(consentTulps && consentGdpr && signature.trim() && !submitting) ? '' : 'is-disabled'}`}
              onClick={submit} disabled={!consentTulps || !consentGdpr || !signature.trim() || submitting}>
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </div>
        </div>
      </>)}
    </div>
  );
}

// ─── DocSlot ──────────────────────────────────────────────────────────────────
function DocSlot({ doc, side, onFile, uploadTxt, uploadingTxt, uploadedTxt }: {
  doc: DocUpload; side: string; onFile: (f: File) => void;
  uploadTxt: string; uploadingTxt: string; uploadedTxt: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const slotClass = `doc-slot ${doc.publicId ? 'is-uploaded' : ''} ${doc.error ? 'is-error' : ''}`;
  return (
    <div onClick={() => !doc.publicId && !doc.uploading && ref.current?.click()} className={slotClass}>
      <input ref={ref} type="file" accept="image/*" capture="environment"
        className="doc-slot__file-input" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />

      {/* Preview immagine — grande e leggibile */}
      {doc.preview ? (
        <div className="doc-slot__preview">
          <img src={doc.preview} alt={side} className="doc-slot__preview-img" />
        </div>
      ) : (
        <div className="doc-slot__placeholder">
          <i className="bi bi-file-earmark-image" aria-hidden="true" />
        </div>
      )}

      <p className="doc-slot__side">{side}</p>
      <p className="doc-slot__status">
        {doc.uploading ? uploadingTxt : doc.publicId ? uploadedTxt : doc.error || uploadTxt}
      </p>
    </div>
  );
}
