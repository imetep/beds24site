'use client';
import { useState, useRef } from 'react';
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
const T: Record<'it' | 'en', Record<string, string>> = {
  it: {
    step1Title:      'Il tuo numero di prenotazione',
    step1Sub:        "Inserisci il numero che trovi nell'email di conferma.",
    bookIdLabel:     'Numero prenotazione',
    bookIdPh:        'es. 12345678',
    verifyBtn:       'Verifica prenotazione',
    verifying:       'Verifica in corso…',
    notFound:        'Prenotazione non trovata. Controlla il numero e riprova.',
    notConfirmed:    'Questa prenotazione non è confermata (stato: ',
    foundTitle:      'Prenotazione trovata',
    propLabel:       'Struttura',
    checkinLabel:    'Check-in',
    checkoutLabel:   'Check-out',
    guestsLabel:     'Ospiti adulti',
    continueBtn:     'Continua →',
    back:            '← Indietro',
    stepOf:          'di',
    step2Title:      'Dati capogruppo',
    step2Sub:        'Inserisci i tuoi dati come da documento di identità.',
    emailLabel:      'Indirizzo email',
    emailNote:       'Verificate attentamente: riceverete la conferma del check-in a questo indirizzo.',
    emailPh:         'es. mario.rossi@email.com',
    lastName:        'Cognome',
    firstName:       'Nome',
    birthDate:       'Data di nascita',
    gender:          'Sesso',
    male:            'Maschio',
    female:          'Femmina',
    birthPlace:      'Luogo di nascita',
    citizenship:     'Cittadinanza',
    docType:         'Tipo documento',
    docNumber:       'Numero documento',
    docIssuePlace:   'Luogo di rilascio documento',
    passport:        'Passaporto',
    idCard:          "Carta d'identità",
    license:         'Patente di guida',
    addGuest:        '+ Aggiungi ospite',
    removeGuest:     'Rimuovi',
    otherGuests:     'Altri ospiti',
    guestType:       'Tipo di ospite',
    familiare:       'Familiare',
    amico:           'Amico',
    guestN:          'Ospite',
    mainGuest:       'Capogruppo',
    step3Title:      'Documento di identità',
    step3Sub:        'Carica fronte e retro del documento del capogruppo.',
    step3SubExtra:   'Il documento è richiesto solo per il capogruppo.',
    docWarning:      'Documenti con visi oscurati, dati coperti o immagini modificate vengono rifiutati automaticamente.',
    gdprNote:        "I dati sono trasmessi alle autorità italiane ai sensi dell'art. 109 TULPS e trattati secondo il Reg. UE 2016/679 (GDPR).",
    frontLabel:      'Fronte',
    backLabel:       'Retro',
    uploadBtn:       'Carica foto',
    uploading:       'Caricamento…',
    uploaded:        'Caricato ✓',
    uploadErr:       'Errore caricamento',
    step4Title:      'Firma e invia',
    step4Sub:        'Verifica i dati e invia la richiesta.',
    summaryTitle:    'Riepilogo',
    summaryCapo:     'Capogruppo',
    summaryOspiti:   'Altri ospiti',
    consentTulps:    "Ho letto la normativa vigente e acconsento alla verifica de visu all'arrivo (art. 109 TULPS).",
    consentGdpr:     'Acconsento al trattamento dei dati personali ai sensi del Reg. UE 2016/679 (GDPR) e dell\'art. 109 TULPS.',
    signLabel:       'Firma digitale — cognome e nome come da documento',
    signPh:          'Es. Rossi Mario',
    submitBtn:       'Invia richiesta',
    submitting:      'Invio in corso…',
    successTitle:    'Richiesta inviata',
    successText:     'Riceverai una email di conferma quando la tua richiesta sarà approvata. Controlla anche la cartella spam.',
    successRef:      'Riferimento prenotazione',
    errorGeneric:    'Si è verificato un errore. Riprova o contattaci via WhatsApp.',
  },
  en: {
    step1Title:      'Your booking number',
    step1Sub:        'Enter the number from your confirmation email.',
    bookIdLabel:     'Booking number',
    bookIdPh:        'e.g. 12345678',
    verifyBtn:       'Verify booking',
    verifying:       'Verifying…',
    notFound:        'Booking not found. Please check the number and try again.',
    notConfirmed:    'This booking is not confirmed (status: ',
    foundTitle:      'Booking found',
    propLabel:       'Property',
    checkinLabel:    'Check-in',
    checkoutLabel:   'Check-out',
    guestsLabel:     'Adult guests',
    continueBtn:     'Continue →',
    back:            '← Back',
    stepOf:          'of',
    step2Title:      'Lead guest details',
    step2Sub:        'Enter your details exactly as shown on your identity document.',
    emailLabel:      'Email address',
    emailNote:       'Please check carefully: your check-in confirmation will be sent to this address.',
    emailPh:         'e.g. mario.rossi@email.com',
    lastName:        'Last name',
    firstName:       'First name',
    birthDate:       'Date of birth',
    gender:          'Gender',
    male:            'Male',
    female:          'Female',
    birthPlace:      'Place of birth',
    citizenship:     'Citizenship',
    docType:         'Document type',
    docNumber:       'Document number',
    docIssuePlace:   'Place of issue',
    passport:        'Passport',
    idCard:          'ID card',
    license:         'Driving licence',
    addGuest:        '+ Add guest',
    removeGuest:     'Remove',
    otherGuests:     'Other guests',
    guestType:       'Guest type',
    familiare:       'Family member',
    amico:           'Friend',
    guestN:          'Guest',
    mainGuest:       'Lead guest',
    step3Title:      'Identity document',
    step3Sub:        'Upload the front and back of the lead guest document.',
    step3SubExtra:   'A document is only required for the lead guest.',
    docWarning:      'Documents with obscured faces, covered data or altered images will be automatically rejected.',
    gdprNote:        'Your data is transmitted to Italian authorities under Art. 109 TULPS and processed in accordance with EU Reg. 2016/679 (GDPR).',
    frontLabel:      'Front',
    backLabel:       'Back',
    uploadBtn:       'Upload photo',
    uploading:       'Uploading…',
    uploaded:        'Uploaded ✓',
    uploadErr:       'Upload error',
    step4Title:      'Sign and submit',
    step4Sub:        'Review your details and submit the request.',
    summaryTitle:    'Summary',
    summaryCapo:     'Lead guest',
    summaryOspiti:   'Other guests',
    consentTulps:    'I have read the applicable regulations and consent to in-person (de visu) verification on arrival (Art. 109 TULPS).',
    consentGdpr:     'I consent to the processing of my personal data in accordance with EU Reg. 2016/679 (GDPR) and Art. 109 TULPS.',
    signLabel:       'Digital signature — last name and first name as on document',
    signPh:          'E.g. Rossi Mario',
    submitBtn:       'Submit request',
    submitting:      'Submitting…',
    successTitle:    'Request submitted',
    successText:     'You will receive a confirmation email once your request has been approved. Please also check your spam folder.',
    successRef:      'Booking reference',
    errorGeneric:    'An error occurred. Please try again or contact us via WhatsApp.',
  },
};

function useT(locale: Locale) { return T[locale === 'it' ? 'it' : 'en']; }

// ─── Stili ────────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 15,
  border: '1px solid #d1d5db', borderRadius: 8,
  background: '#fff', color: '#111', outline: 'none', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4,
};
const fw: React.CSSProperties = { marginBottom: 12 };
const btnP: React.CSSProperties = {
  width: '100%', padding: '13px 20px', fontSize: 15, fontWeight: 700,
  background: '#1E73BE', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
};
const btnS: React.CSSProperties = {
  padding: '10px 16px', fontSize: 14, background: 'none', color: '#6b7280',
  border: '0.5px solid #d1d5db', borderRadius: 8, cursor: 'pointer',
};

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
  const [docs, setDocs]   = useState<DocUpload[]>([
    { label: 'capogruppo_front', publicId: '', preview: '', uploading: false, error: '' },
    { label: 'capogruppo_back',  publicId: '', preview: '', uploading: false, error: '' },
  ]);
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
  const validateDocs = () => docs.every(d => d.publicId !== '');

  // ── Step 4 ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!signature.trim() || !consentTulps || !consentGdpr) return;
    setSubmitting(true); setSubmitErr('');
    try {
      const res = await fetch('/api/checkin/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: booking!.bookId, roomName: booking!.roomName,
          checkIn: booking!.checkIn, checkOut: booking!.checkOut,
          capogruppo: capo, altri,
          docs: docs.filter(d => d.publicId).map(d => ({ label: d.label, publicId: d.publicId })),
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
    <div style={{ background: '#fff', padding: '14px 20px', borderBottom: '0.5px solid #f3f4f6', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#9ca3af' }}>
        <span>Step {step} {t.stepOf} 4</span><span>{Math.round((step / 4) * 100)}%</span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: 99, height: 4 }}>
        <div style={{ background: '#1E73BE', borderRadius: 99, height: 4, width: `${(step / 4) * 100}%`, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );

  // ─── COMPLETATO ───────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 12 }}>{t.successTitle}</h1>
      <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 20 }}>{t.successText}</p>
      <div style={{ background: '#EEF5FC', borderRadius: 10, padding: '12px 20px', display: 'inline-block' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#185FA5' }}>{t.successRef}: <strong>#{booking!.bookId}</strong></p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 60px' }}>

      {/* ── STEP 1 ────────────────────────────────────────────────────────── */}
      {step === 1 && (<>
        <Bar />
        <div style={{ background: '#fff', padding: '20px 20px 24px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{t.step1Title}</h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>{t.step1Sub}</p>
          <div style={fw}>
            <label style={lbl}>{t.bookIdLabel}</label>
            <input style={inp} type="number" inputMode="numeric" placeholder={t.bookIdPh}
              value={bookIdInput}
              onChange={e => { setBookIdInput(e.target.value); setVerifyErr(''); setBooking(null); }}
              onKeyDown={e => e.key === 'Enter' && verifyBooking()} />
          </div>
          {verifyErr && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{verifyErr}</p>}
          {booking ? (<>
            <div style={{ background: '#EAF3DE', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '0.5px solid #C0DD97' }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#27500A' }}>{t.foundTitle} ✓</p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#3B6D11' }}>{t.propLabel}: <strong>{booking.roomName}</strong></p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#3B6D11' }}>{t.checkinLabel}: <strong>{booking.checkIn}</strong> — {t.checkoutLabel}: <strong>{booking.checkOut}</strong></p>
              <p style={{ margin: 0, fontSize: 13, color: '#3B6D11' }}>{t.guestsLabel}: <strong>{booking.numAdult}</strong></p>
            </div>
            <button style={btnP} onClick={() => setStep(2)}>{t.continueBtn}</button>
          </>) : (
            <button style={{ ...btnP, opacity: verifying || !bookIdInput.trim() ? 0.6 : 1 }}
              onClick={verifyBooking} disabled={verifying || !bookIdInput.trim()}>
              {verifying ? t.verifying : t.verifyBtn}
            </button>
          )}
        </div>
      </>)}

      {/* ── STEP 2 ────────────────────────────────────────────────────────── */}
      {step === 2 && (<>
        <Bar />
        <div style={{ background: '#fff', padding: '20px 20px 24px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{t.step2Title}</h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>{t.step2Sub}</p>

          {/* Capogruppo */}
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#374151' }}>👤 {t.mainGuest}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={fw}><label style={lbl}>{t.lastName} *</label>
              <input style={inp} value={capo.lastName} onChange={e => setCapo(c => ({ ...c, lastName: e.target.value }))} /></div>
            <div style={fw}><label style={lbl}>{t.firstName} *</label>
              <input style={inp} value={capo.firstName} onChange={e => setCapo(c => ({ ...c, firstName: e.target.value }))} /></div>
          </div>

          {/* Email — campo critico con nota di verifica */}
          <div style={{ ...fw, marginBottom: 16 }}>
            <label style={lbl}>{t.emailLabel} *</label>
            <input style={inp} type="email" inputMode="email" placeholder={t.emailPh}
              value={capo.email} onChange={e => setCapo(c => ({ ...c, email: e.target.value }))} />
            <div style={{ marginTop: 6, background: '#FFF9E6', border: '0.5px solid #FDE68A', borderRadius: 6, padding: '6px 10px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#713f12' }}>⚠️ {t.emailNote}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={fw}><label style={lbl}>{t.birthDate} *</label>
              <input style={inp} type="date" value={capo.birthDate} onChange={e => setCapo(c => ({ ...c, birthDate: e.target.value }))} /></div>
            <div style={fw}><label style={lbl}>{t.gender} *</label>
              <select style={{ ...inp, appearance: 'none' }} value={capo.gender} onChange={e => setCapo(c => ({ ...c, gender: e.target.value }))}>
                <option value="M">{t.male}</option><option value="F">{t.female}</option>
              </select></div>
          </div>
          <div style={fw}><label style={lbl}>{t.birthPlace} *</label>
            <input style={inp} value={capo.birthPlace} onChange={e => setCapo(c => ({ ...c, birthPlace: e.target.value }))} /></div>
          <div style={fw}><label style={lbl}>{t.citizenship} *</label>
            <input style={inp} value={capo.citizenship} onChange={e => setCapo(c => ({ ...c, citizenship: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={fw}><label style={lbl}>{t.docType} *</label>
              <select style={{ ...inp, appearance: 'none' }} value={capo.docType} onChange={e => setCapo(c => ({ ...c, docType: e.target.value }))}>
                <option value="passport">{t.passport}</option>
                <option value="id_card">{t.idCard}</option>
                <option value="license">{t.license}</option>
              </select></div>
            <div style={fw}><label style={lbl}>{t.docNumber} *</label>
              <input style={inp} value={capo.docNumber} onChange={e => setCapo(c => ({ ...c, docNumber: e.target.value }))} /></div>
          </div>
          <div style={{ ...fw, marginBottom: 20 }}><label style={lbl}>{t.docIssuePlace} *</label>
            <input style={inp} value={capo.docIssuePlace} onChange={e => setCapo(c => ({ ...c, docIssuePlace: e.target.value }))} /></div>

          {/* Altri ospiti */}
          {altri.length > 0 && (<>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151', borderTop: '0.5px solid #f3f4f6', paddingTop: 16 }}>
              👥 {t.otherGuests}
            </p>
            {altri.map((a, idx) => (
              <div key={idx} style={{ marginBottom: 12, padding: 14, background: '#f9fafb', borderRadius: 10, border: '0.5px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.guestN} {idx + 2}</p>
                  <button style={{ ...btnS, fontSize: 12, padding: '4px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => setAltri(p => p.filter((_, i) => i !== idx))}>{t.removeGuest}</button>
                </div>
                <div style={fw}><label style={lbl}>{t.guestType} *</label>
                  <select style={{ ...inp, appearance: 'none' }} value={a.guestType} onChange={e => updA(idx, 'guestType', e.target.value)}>
                    <option value="familiare">{t.familiare}</option>
                    <option value="amico">{t.amico}</option>
                  </select></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={fw}><label style={lbl}>{t.lastName} *</label>
                    <input style={inp} value={a.lastName} onChange={e => updA(idx, 'lastName', e.target.value)} /></div>
                  <div style={fw}><label style={lbl}>{t.firstName} *</label>
                    <input style={inp} value={a.firstName} onChange={e => updA(idx, 'firstName', e.target.value)} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={fw}><label style={lbl}>{t.birthDate} *</label>
                    <input style={inp} type="date" value={a.birthDate} onChange={e => updA(idx, 'birthDate', e.target.value)} /></div>
                  <div style={fw}><label style={lbl}>{t.gender} *</label>
                    <select style={{ ...inp, appearance: 'none' }} value={a.gender} onChange={e => updA(idx, 'gender', e.target.value)}>
                      <option value="M">{t.male}</option><option value="F">{t.female}</option>
                    </select></div>
                </div>
                <div style={fw}><label style={lbl}>{t.birthPlace} *</label>
                  <input style={inp} value={a.birthPlace} onChange={e => updA(idx, 'birthPlace', e.target.value)} /></div>
                <div style={fw}><label style={lbl}>{t.citizenship} *</label>
                  <input style={inp} value={a.citizenship} onChange={e => updA(idx, 'citizenship', e.target.value)} /></div>
              </div>
            ))}
          </>)}

          <button style={{ ...btnS, width: '100%', marginBottom: 16 }}
            onClick={() => setAltri(p => [...p, { guestType: 'amico', lastName: '', firstName: '', birthDate: '', gender: 'M', birthPlace: '', citizenship: '' }])}>
            {t.addGuest}
          </button>
          {step2Errors.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '0.5px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Campi mancanti:</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                {step2Errors.map((e, i) => <li key={i} style={{ fontSize: 13, color: '#dc2626' }}>{e}</li>)}
              </ul>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...btnS, flex: 1 }} onClick={() => setStep(1)}>{t.back}</button>
            <button style={{ ...btnP, flex: 2 }} onClick={tryStep3}>{t.continueBtn}</button>
          </div>
        </div>
      </>)}

      {/* ── STEP 3 ────────────────────────────────────────────────────────── */}
      {step === 3 && (<>
        <Bar />
        <div style={{ background: '#fff', padding: '20px 20px 24px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{t.step3Title}</h1>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: '#6b7280' }}>{t.step3Sub}</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#9ca3af' }}>{t.step3SubExtra}</p>
          <div style={{ background: '#FEF2F2', border: '0.5px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#991B1B' }}>⚠️ {t.docWarning}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#7f1d1d' }}>{t.gdprNote}</p>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#374151' }}>{capo.lastName} {capo.firstName}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {docs.map((doc, idx) => (
              <DocSlot key={doc.label} doc={doc}
                side={doc.label.endsWith('_front') ? t.frontLabel : t.backLabel}
                onFile={f => uploadDoc(idx, f)}
                uploadTxt={t.uploadBtn} uploadingTxt={t.uploading} uploadedTxt={t.uploaded} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...btnS, flex: 1 }} onClick={() => setStep(2)}>{t.back}</button>
            <button style={{ ...btnP, flex: 2, opacity: validateDocs() ? 1 : 0.5 }}
              onClick={() => validateDocs() && setStep(4)} disabled={!validateDocs()}>{t.continueBtn}</button>
          </div>
        </div>
      </>)}

      {/* ── STEP 4 ────────────────────────────────────────────────────────── */}
      {step === 4 && (<>
        <Bar />
        <div style={{ background: '#fff', padding: '20px 20px 24px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{t.step4Title}</h1>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>{t.step4Sub}</p>
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' }}>{t.summaryTitle}</p>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: '#4b5563' }}>{t.propLabel}: <strong>{booking!.roomName}</strong></p>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#4b5563' }}>{t.checkinLabel}: <strong>{booking!.checkIn}</strong> — {t.checkoutLabel}: <strong>{booking!.checkOut}</strong></p>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{t.summaryCapo}</p>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: '#374151' }}>{capo.lastName} {capo.firstName} — {capo.docType} {capo.docNumber}</p>
            {altri.length > 0 && (<>
              <p style={{ margin: '6px 0 4px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{t.summaryOspiti}</p>
              {altri.map((a, i) => (
                <p key={i} style={{ margin: '0 0 2px', fontSize: 12, color: '#4b5563' }}>
                  {a.lastName} {a.firstName} ({t[a.guestType] ?? a.guestType})
                </p>
              ))}
            </>)}
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={consentTulps} onChange={e => setTulps(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{t.consentTulps} *</span>
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer' }}>
            <input type="checkbox" checked={consentGdpr} onChange={e => setGdpr(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{t.consentGdpr} *</span>
          </label>
          <div style={fw}>
            <label style={lbl}>{t.signLabel} *</label>
            <input style={inp} value={signature} onChange={e => setSignature(e.target.value)} placeholder={t.signPh} />
          </div>
          {submitErr && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{submitErr}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button style={{ ...btnS, flex: 1 }} onClick={() => setStep(3)} disabled={submitting}>{t.back}</button>
            <button style={{ ...btnP, flex: 2, opacity: (consentTulps && consentGdpr && signature.trim() && !submitting) ? 1 : 0.5 }}
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
  return (
    <div onClick={() => !doc.publicId && !doc.uploading && ref.current?.click()} style={{
      border: `1.5px dashed ${doc.publicId ? '#86efac' : doc.error ? '#fca5a5' : '#d1d5db'}`,
      borderRadius: 10, padding: '14px 10px', textAlign: 'center',
      cursor: doc.publicId ? 'default' : 'pointer',
      background: doc.publicId ? '#f0fdf4' : '#fafafa',
      minHeight: 110, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      <input ref={ref} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      {doc.preview
        ? <img src={doc.preview} alt={side} style={{ width: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: 6 }} />
        : <span style={{ fontSize: 28 }}>📄</span>}
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }}>{side}</p>
      <p style={{ margin: 0, fontSize: 11, color: doc.publicId ? '#15803d' : doc.error ? '#dc2626' : '#9ca3af' }}>
        {doc.uploading ? uploadingTxt : doc.publicId ? uploadedTxt : doc.error || uploadTxt}
      </p>
    </div>
  );
}
