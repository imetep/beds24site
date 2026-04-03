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
    step3Title:      'Documenti di identità',
    step3Sub:        'Carica fronte e retro del documento del capogruppo. Per gli altri ospiti carica il fronte.',
    step3SubExtra:   '',
    docWarning:      'Documenti con visi oscurati, dati coperti o immagini modificate vengono rifiutati automaticamente.',
    gdprNote:        "I dati sono trasmessi alle autorità italiane ai sensi dell'art. 109 TULPS e trattati secondo il Reg. UE 2016/679 (GDPR).",
    frontLabel:      'Fronte',
    backLabel:       'Retro',
    uploadBtn:       'Tocca per caricare',
    uploading:       'Caricamento…',
    uploaded:        'Caricato ✓',
    uploadErr:       'Errore caricamento',
    step4Title:      'Firma e invia',
    step4Sub:        'Verifica i dati e invia la richiesta.',
    summaryTitle:    'Riepilogo',
    summaryCapo:     'Capogruppo',
    summaryOspiti:   'Altri ospiti',
    consentTulps:    "Ho letto la normativa vigente e acconsento alla verifica de visu all'arrivo (art. 109 TULPS).",
    consentGdpr:     "Acconsento al trattamento dei dati personali ai sensi del Reg. UE 2016/679 (GDPR) e dell'art. 109 TULPS.",
    signLabel:       'Firma digitale — cognome e nome come da documento',
    signPh:          'Es. Rossi Mario',
    submitBtn:       'Invia richiesta',
    submitting:      'Invio in corso…',
    successTitle:    'Richiesta inviata',
    successText:     'Riceverai una email di conferma quando la tua richiesta sarà approvata. Controlla anche la cartella spam.',
    successRef:      'Riferimento prenotazione',
    errorGeneric:    'Si è verificato un errore. Riprova o contattaci via WhatsApp.',
    docSection:      'Documenti',
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
    license:         "Driver's licence",
    addGuest:        '+ Add guest',
    removeGuest:     'Remove',
    otherGuests:     'Other guests',
    guestType:       'Guest type',
    familiare:       'Family member',
    amico:           'Friend',
    guestN:          'Guest',
    mainGuest:       'Lead guest',
    step3Title:      'Identity documents',
    step3Sub:        'Upload front and back of the lead guest document. For other guests, upload the front only.',
    step3SubExtra:   '',
    docWarning:      'Documents with obscured faces, covered data or edited images are automatically rejected.',
    gdprNote:        'Your data is transmitted to Italian authorities under art. 109 TULPS and processed under EU Regulation 2016/679 (GDPR).',
    frontLabel:      'Front',
    backLabel:       'Back',
    uploadBtn:       'Tap to upload',
    uploading:       'Uploading…',
    uploaded:        'Uploaded ✓',
    uploadErr:       'Upload error',
    step4Title:      'Sign and submit',
    step4Sub:        'Review your details and submit the request.',
    summaryTitle:    'Summary',
    summaryCapo:     'Lead guest',
    summaryOspiti:   'Other guests',
    consentTulps:    'I have read the applicable regulations and consent to in-person verification on arrival (art. 109 TULPS).',
    consentGdpr:     'I consent to the processing of my personal data under EU Regulation 2016/679 (GDPR) and art. 109 TULPS.',
    signLabel:       'Digital signature — last name and first name as on document',
    signPh:          'E.g. Rossi Mario',
    submitBtn:       'Submit request',
    submitting:      'Submitting…',
    successTitle:    'Request submitted',
    successText:     'You will receive a confirmation email once your request is approved. Check your spam folder too.',
    successRef:      'Booking reference',
    errorGeneric:    'An error occurred. Please try again or contact us via WhatsApp.',
    docSection:      'Documents',
  },
};
function useT(locale: Locale) {
  const lang = (locale === 'it' || locale === 'en') ? locale : 'it';
  return T[lang];
}

// ─── Stili ────────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 16,
  border: '1.5px solid #e5e7eb', borderRadius: 10,
  background: '#fafafa', color: '#111', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#6b7280',
  display: 'block', marginBottom: 5, letterSpacing: '0.04em',
  textTransform: 'uppercase',
};
const fw: React.CSSProperties = { marginBottom: 14 };
// Flex item per layout 2 colonne responsive
const half: React.CSSProperties = { flex: '1 1 200px', marginBottom: 14 };
const btnP: React.CSSProperties = {
  width: '100%', padding: '14px 20px', fontSize: 16, fontWeight: 700,
  background: '#1E73BE', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
};
const btnS: React.CSSProperties = {
  padding: '12px 16px', fontSize: 14, background: '#fff', color: '#374151',
  border: '1.5px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
};

// Helper: riga a due colonne responsive
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {children}
    </div>
  );
}

// Helper: separatore sezione
function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 14px', paddingTop: 4,
      borderTop: '1.5px solid #f3f4f6' }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E73BE', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
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
    <div style={{ background: '#fff', padding: '14px 20px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#9ca3af' }}>
        <span>Step {step} {t.stepOf} 4</span><span>{Math.round((step / 4) * 100)}%</span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: 99, height: 4 }}>
        <div style={{ background: '#1E73BE', borderRadius: 99, height: 4, width: `${(step / 4) * 100}%`, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );

  // ─── COMPLETATO ───────────────────────────────────────────────────────────
  if (done) {
    const isEn = locale === 'en';
    const statusUrl = `/it/self-checkin/wizard/status?bookId=${booking!.bookId}`;
    const steps = isEn ? [
      { icon: '📧', title: 'Deposit link incoming', text: "You will shortly receive an email with the link to authorize the security deposit. Check your inbox (and spam)." },
      { icon: '🔍', title: 'Document review', text: 'We will verify your documents within 24 hours.' },
      { icon: '✅', title: 'Approval email', text: 'You will receive a confirmation email with the outcome of your request.' },
    ] : [
      { icon: '📧', title: 'Link deposito in arrivo', text: "A breve riceverai un'email con il link per autorizzare il deposito cauzionale. Controlla la casella (e lo spam)." },
      { icon: '🔍', title: 'Verifica documenti', text: 'Verificheremo i tuoi documenti entro 24 ore.' },
      { icon: '✅', title: 'Email di approvazione', text: "Riceverai una email con l'esito della tua richiesta." },
    ];
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>
            {isEn ? 'Request submitted' : 'Richiesta inviata'}
          </h1>
          <div style={{ display: 'inline-block', background: '#EEF5FC', borderRadius: 10, padding: '8px 18px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#185FA5' }}>
              {isEn ? 'Booking reference' : 'Riferimento prenotazione'}: <strong>#{booking!.bookId}</strong>
            </p>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isEn ? 'What happens next' : 'Cosa succede adesso'}
          </p>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < steps.length - 1 ? 16 : 0, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{s.icon}</div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#111' }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#111' }}>
            {isEn ? 'Track your request' : 'Segui la tua richiesta'}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            {isEn ? 'Check the status and send us messages at any time:' : 'Controlla lo stato e scrivici in qualsiasi momento:'}
          </p>
          <a href={statusUrl} style={{
            display: 'block', textAlign: 'center', padding: '12px 20px',
            background: '#1E73BE', color: '#fff', borderRadius: 10,
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}>
            {isEn ? 'Go to my request →' : 'Vai alla mia richiesta →'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>

      {/* ── STEP 1 ────────────────────────────────────────────────────────── */}
      {step === 1 && (<>
        <Bar />
        <div style={{ background: '#fff', padding: '24px 20px 28px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{t.step1Title}</h1>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{t.step1Sub}</p>
          <div style={fw}>
            <label style={lbl}>{t.bookIdLabel}</label>
            <input style={inp} type="number" inputMode="numeric" placeholder={t.bookIdPh}
              tabIndex={1}
              value={bookIdInput}
              onChange={e => { setBookIdInput(e.target.value); setVerifyErr(''); setBooking(null); }}
              onKeyDown={e => e.key === 'Enter' && verifyBooking()} />
          </div>
          {verifyErr && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{verifyErr}</p>}
          {booking ? (<>
            <div style={{ background: '#EAF3DE', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: '1px solid #C0DD97' }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#27500A' }}>{t.foundTitle} ✓</p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#3B6D11' }}>{t.propLabel}: <strong>{booking.roomName}</strong></p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#3B6D11' }}>{t.checkinLabel}: <strong>{booking.checkIn}</strong> — {t.checkoutLabel}: <strong>{booking.checkOut}</strong></p>
              <p style={{ margin: 0, fontSize: 13, color: '#3B6D11' }}>{t.guestsLabel}: <strong>{booking.numAdult}</strong></p>
            </div>
            <button style={btnP} onClick={() => setStep(2)} tabIndex={2}>{t.continueBtn}</button>
          </>) : (
            <button style={{ ...btnP, opacity: verifying || !bookIdInput.trim() ? 0.6 : 1 }}
              onClick={verifyBooking} disabled={verifying || !bookIdInput.trim()} tabIndex={2}>
              {verifying ? t.verifying : t.verifyBtn}
            </button>
          )}
        </div>
      </>)}

      {/* ── STEP 2 ────────────────────────────────────────────────────────── */}
      {step === 2 && (<>
        <Bar />
        <div style={{ background: '#fff', padding: '24px 20px 28px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{t.step2Title}</h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{t.step2Sub}</p>

          {/* ── Capogruppo ── */}
          <SectionHeader label={t.mainGuest} icon="👤" />

          <Row>
            <div style={half}>
              <label style={lbl}>{t.lastName} *</label>
              <input style={inp} tabIndex={1} value={capo.lastName}
                onChange={e => setCapo(c => ({ ...c, lastName: e.target.value }))} />
            </div>
            <div style={half}>
              <label style={lbl}>{t.firstName} *</label>
              <input style={inp} tabIndex={2} value={capo.firstName}
                onChange={e => setCapo(c => ({ ...c, firstName: e.target.value }))} />
            </div>
          </Row>

          <div style={fw}>
            <label style={lbl}>{t.emailLabel} *</label>
            <input style={inp} type="email" inputMode="email" placeholder={t.emailPh}
              tabIndex={3} value={capo.email}
              onChange={e => setCapo(c => ({ ...c, email: e.target.value }))} />
            <div style={{ marginTop: 6, background: '#FFF9E6', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#713f12' }}>⚠️ {t.emailNote}</p>
            </div>
          </div>

          <Row>
            <div style={half}>
              <label style={lbl}>{t.birthDate} *</label>
              <input style={inp} type="date" tabIndex={4} value={capo.birthDate}
                onChange={e => setCapo(c => ({ ...c, birthDate: e.target.value }))} />
            </div>
            <div style={half}>
              <label style={lbl}>{t.gender} *</label>
              <select style={{ ...inp, appearance: 'none' }} tabIndex={5} value={capo.gender}
                onChange={e => setCapo(c => ({ ...c, gender: e.target.value }))}>
                <option value="M">{t.male}</option>
                <option value="F">{t.female}</option>
              </select>
            </div>
          </Row>

          <div style={fw}>
            <label style={lbl}>{t.birthPlace} *</label>
            <input style={inp} tabIndex={6} value={capo.birthPlace}
              onChange={e => setCapo(c => ({ ...c, birthPlace: e.target.value }))} />
          </div>

          <div style={fw}>
            <label style={lbl}>{t.citizenship} *</label>
            <input style={inp} tabIndex={7} value={capo.citizenship}
              onChange={e => setCapo(c => ({ ...c, citizenship: e.target.value }))} />
          </div>

          <Row>
            <div style={half}>
              <label style={lbl}>{t.docType} *</label>
              <select style={{ ...inp, appearance: 'none' }} tabIndex={8} value={capo.docType}
                onChange={e => setCapo(c => ({ ...c, docType: e.target.value }))}>
                <option value="passport">{t.passport}</option>
                <option value="id_card">{t.idCard}</option>
                <option value="license">{t.license}</option>
              </select>
            </div>
            <div style={half}>
              <label style={lbl}>{t.docNumber} *</label>
              <input style={inp} tabIndex={9} value={capo.docNumber}
                onChange={e => setCapo(c => ({ ...c, docNumber: e.target.value }))} />
            </div>
          </Row>

          <div style={{ ...fw, marginBottom: 20 }}>
            <label style={lbl}>{t.docIssuePlace} *</label>
            <input style={inp} tabIndex={10} value={capo.docIssuePlace}
              onChange={e => setCapo(c => ({ ...c, docIssuePlace: e.target.value }))} />
          </div>

          {/* ── Altri ospiti ── */}
          {altri.length > 0 && (
            <SectionHeader label={t.otherGuests} icon="👥" />
          )}

          {altri.map((a, idx) => (
            <div key={idx} style={{ marginBottom: 16, padding: '16px 14px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E73BE' }}>{t.guestN} {idx + 2}</span>
                <button style={{ ...btnS, fontSize: 12, padding: '4px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => removeAltro(idx)}>{t.removeGuest}</button>
              </div>
              <div style={fw}>
                <label style={lbl}>{t.guestType} *</label>
                <select style={{ ...inp, appearance: 'none' }} value={a.guestType}
                  onChange={e => updA(idx, 'guestType', e.target.value)}>
                  <option value="familiare">{t.familiare}</option>
                  <option value="amico">{t.amico}</option>
                </select>
              </div>
              <Row>
                <div style={half}>
                  <label style={lbl}>{t.lastName} *</label>
                  <input style={inp} value={a.lastName} onChange={e => updA(idx, 'lastName', e.target.value)} />
                </div>
                <div style={half}>
                  <label style={lbl}>{t.firstName} *</label>
                  <input style={inp} value={a.firstName} onChange={e => updA(idx, 'firstName', e.target.value)} />
                </div>
              </Row>
              <Row>
                <div style={half}>
                  <label style={lbl}>{t.birthDate} *</label>
                  <input style={inp} type="date" value={a.birthDate} onChange={e => updA(idx, 'birthDate', e.target.value)} />
                </div>
                <div style={half}>
                  <label style={lbl}>{t.gender} *</label>
                  <select style={{ ...inp, appearance: 'none' }} value={a.gender} onChange={e => updA(idx, 'gender', e.target.value)}>
                    <option value="M">{t.male}</option>
                    <option value="F">{t.female}</option>
                  </select>
                </div>
              </Row>
              <div style={fw}>
                <label style={lbl}>{t.birthPlace} *</label>
                <input style={inp} value={a.birthPlace} onChange={e => updA(idx, 'birthPlace', e.target.value)} />
              </div>
              <div style={{ ...fw, marginBottom: 0 }}>
                <label style={lbl}>{t.citizenship} *</label>
                <input style={inp} value={a.citizenship} onChange={e => updA(idx, 'citizenship', e.target.value)} />
              </div>
            </div>
          ))}

          <button style={{ ...btnS, width: '100%', marginBottom: 20, textAlign: 'center' }}
            onClick={addAltro}>
            {t.addGuest}
          </button>

          {step2Errors.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
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
        <div style={{ background: '#fff', padding: '24px 20px 28px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{t.step3Title}</h1>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{t.step3Sub}</p>

          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#991B1B' }}>⚠️ {t.docWarning}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#7f1d1d' }}>{t.gdprNote}</p>
          </div>

          {/* Capogruppo docs */}
          <SectionHeader label={`${capo.lastName} ${capo.firstName}`} icon="👤" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            {docs.map((doc, idx) => (
              <div key={doc.label} style={{ flex: '1 1 240px' }}>
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
              <SectionHeader label={`${a.lastName} ${a.firstName}`} icon="👤" />
              <div style={{ marginBottom: 20 }}>
                {altriDocs[idx] && (
                  <DocSlot doc={altriDocs[idx]}
                    side={t.frontLabel}
                    onFile={f => uploadAltroDoc(idx, f)}
                    uploadTxt={t.uploadBtn} uploadingTxt={t.uploading} uploadedTxt={t.uploaded} />
                )}
              </div>
            </div>
          ))}

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
        <div style={{ background: '#fff', padding: '24px 20px 28px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{t.step4Title}</h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{t.step4Sub}</p>

          {/* Riepilogo */}
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px', marginBottom: 24, border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t.summaryTitle}</p>
            <p style={{ margin: '0 0 2px', fontSize: 14, color: '#374151' }}>{t.propLabel}: <strong>{booking!.roomName}</strong></p>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#374151' }}>{t.checkinLabel}: <strong>{booking!.checkIn}</strong> → <strong>{booking!.checkOut}</strong></p>
            <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{t.summaryCapo}</p>
            <p style={{ margin: '0 0 2px', fontSize: 14, color: '#111' }}>{capo.lastName} {capo.firstName} — {capo.docType} {capo.docNumber}</p>
            {altri.length > 0 && (<>
              <p style={{ margin: '10px 0 3px', fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{t.summaryOspiti}</p>
              {altri.map((a, i) => (
                <p key={i} style={{ margin: '0 0 2px', fontSize: 14, color: '#374151' }}>
                  {a.lastName} {a.firstName} ({t[a.guestType] ?? a.guestType})
                </p>
              ))}
            </>)}
          </div>

          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={consentTulps} onChange={e => setTulps(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, width: 18, height: 18 }} />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{t.consentTulps} *</span>
          </label>
          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24, cursor: 'pointer' }}>
            <input type="checkbox" checked={consentGdpr} onChange={e => setGdpr(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, width: 18, height: 18 }} />
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
      border: `2px dashed ${doc.publicId ? '#86efac' : doc.error ? '#fca5a5' : '#d1d5db'}`,
      borderRadius: 12, padding: '12px',
      cursor: doc.publicId ? 'default' : 'pointer',
      background: doc.publicId ? '#f0fdf4' : '#fafafa',
    }}>
      <input ref={ref} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />

      {/* Preview immagine — grande e leggibile */}
      {doc.preview ? (
        <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', lineHeight: 0 }}>
          <img src={doc.preview} alt={side} style={{
            width: '100%',
            maxHeight: 180,
            objectFit: 'contain',
            display: 'block',
          }} />
        </div>
      ) : (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 40 }}>📄</span>
        </div>
      )}

      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'center' }}>{side}</p>
      <p style={{ margin: 0, fontSize: 12, color: doc.publicId ? '#15803d' : doc.error ? '#dc2626' : '#9ca3af', textAlign: 'center' }}>
        {doc.uploading ? uploadingTxt : doc.publicId ? uploadedTxt : doc.error || uploadTxt}
      </p>
    </div>
  );
}
