# UI Components

Componenti riusabili allineati al design system del progetto (tokens in `app/globals.css`).

Da usare per nuovi sviluppi e per migrare gradualmente i pattern duplicati nel codice esistente. Tutti rispettano:

- Touch target ≥ 44px (`--touch-target`)
- Spacing scale (`--space-*`)
- Radius scale (`--radius-*`)
- Typography scale (`--text-*`)
- Color tokens (`--color-*`)
- WCAG AA contrast

## Card

Wrapper con padding/radius/border/shadow tokenizzati. Sostituisce i pattern card sparsi (`ChangeRequestWizard`, `WizardStep2`, `WizardStep3`, `BookingPanel`).

```tsx
import Card from '@/components/ui/Card';

<Card padding="base" radius="md" shadow>
  Contenuto
</Card>
```

Props: `padding` (sm/md/base/lg), `radius` (sm/md/lg), `shadow`, `background`, `borderColor`.

## Button

Bottone con varianti `primary` (CTA arancione), `secondary` (bordato blu), `ghost` (testo).
Sostituisce i bottoni custom sparsi nel wizard, BookingPanel, GuestLogin.

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="lg" fullWidth onClick={handleClick}>
  Prenota
</Button>
```

Props: `variant` (primary/secondary/ghost), `size` (sm/md/lg), `fullWidth`, + tutte le props `<button>`.

## FormField

Wrapper per input/textarea/select con label, hint, error message. Gestisce automaticamente `min-height: 44px` e contrasto bordi.

```tsx
import FormField from '@/components/ui/FormField';

<FormField
  label="Nome"
  value={name}
  onChange={e => setName(e.target.value)}
  error={errors.name}
  hint="Come appare sul documento"
/>

<FormField
  as="textarea"
  label="Note"
  value={notes}
  onChange={e => setNotes(e.target.value)}
/>

<FormField as="select" label="Paese" value={country} onChange={e => setCountry(e.target.value)}>
  <option value="IT">Italia</option>
  <option value="DE">Germania</option>
</FormField>
```

## Migrazione progressiva

Non è obbligatorio migrare subito. Approccio consigliato:

1. **Nuovi sviluppi**: usa sempre questi componenti.
2. **File toccati per altri motivi**: cogli l'occasione per sostituire pattern locali con questi.
3. **Refactor mirato**: dopo che pattern locali divergono, allineali a uno dei tre componenti.

I file più candidati alla migrazione (per inline styles ripetuti):
- `WizardStep2.tsx` (form ospite — usa FormField)
- `WizardCheckin.tsx` (form esteso — usa FormField + Button)
- `ChangeRequestWizard.tsx` (card duplicate — usa Card)
- `GuestLogin.tsx` (login — Button + FormField)
