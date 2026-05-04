/**
 * <PaymentLogos /> — strip loghi metodi di pagamento accettati (Visa, Mastercard,
 * Amex, PayPal). SVG inline a colori brand per riconoscibilità (Booking/Airbnb
 * pattern). Eccezione consapevole alla policy "SVG outline" del design system:
 * sono brand marks informativi, non icone funzionali.
 */

const Visa = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" aria-label="Visa">
    <rect width="38" height="24" rx="3" fill="#1A1F71" />
    <path
      fill="#F7B600"
      d="M15.7 16.3h-2.1l1.3-8.6h2.1l-1.3 8.6Zm7.6-8.4a5.5 5.5 0 0 0-1.9-.3c-2 0-3.5 1-3.5 2.6 0 1.1 1.1 1.7 1.9 2.1.8.3 1.1.6 1.1.9 0 .5-.6.7-1.2.7a4 4 0 0 1-1.9-.4l-.3-.1-.3 1.7a6 6 0 0 0 2.2.4c2.2 0 3.6-1 3.6-2.7 0-.9-.6-1.6-1.8-2.1-.8-.4-1.2-.6-1.2-1 0-.3.4-.6 1.2-.6a3.7 3.7 0 0 1 1.6.3l.2.1.3-1.6Zm5.4-.2H27c-.5 0-.9.1-1.2.7l-3.3 7.9h2.3l.5-1.3h2.8l.3 1.3h2.1l-1.8-8.6Zm-2.7 5.6.9-2.4.1-.3.1.3.5 2.4h-1.6Zm-13-5.6-2.1 5.9-.2-1.1c-.4-1.3-1.6-2.7-3-3.4l1.9 7.2h2.3l3.4-8.6h-2.3Z"
    />
    <path
      fill="#F7B600"
      d="M9.4 7.7H6c-.1 0-.3.2-.4.4l-.1.5c2.4.6 4 2 4.6 3.6L9.4 8.2c-.1-.4-.4-.5-.7-.5"
    />
  </svg>
);

const Mastercard = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" aria-label="Mastercard">
    <rect width="38" height="24" rx="3" fill="#fff" stroke="#E0E0E0" strokeWidth="0.5" />
    <circle cx="15.5" cy="12" r="6" fill="#EB001B" />
    <circle cx="22.5" cy="12" r="6" fill="#F79E1B" />
    <path
      fill="#FF5F00"
      d="M19 7.3a6 6 0 0 0 0 9.4 6 6 0 0 0 0-9.4Z"
    />
  </svg>
);

const Amex = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" aria-label="American Express">
    <rect width="38" height="24" rx="3" fill="#006FCF" />
    <text
      x="19"
      y="15.5"
      textAnchor="middle"
      fill="#fff"
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight="700"
      fontSize="7.5"
      letterSpacing="0.2"
    >
      AMEX
    </text>
  </svg>
);

const PayPal = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" aria-label="PayPal">
    <rect width="38" height="24" rx="3" fill="#fff" stroke="#E0E0E0" strokeWidth="0.5" />
    <path
      fill="#003087"
      d="M13.7 7.5h-2.6c-.2 0-.3.1-.4.3l-1.1 6.7c0 .1 0 .2.2.2h1.3c.2 0 .3-.1.4-.3l.3-1.8c0-.2.2-.3.4-.3h.8c1.7 0 2.7-.8 3-2.5.1-.7 0-1.3-.3-1.7-.4-.4-1-.6-1.9-.6Zm.3 2.5c-.1.9-.8.9-1.5.9h-.4l.3-1.7c0-.1.1-.2.2-.2h.2c.5 0 .9 0 1.1.3.2.1.2.4.1.7Z"
    />
    <path
      fill="#009CDE"
      d="M22 10h-1.3c-.1 0-.2.1-.2.2v.3l-.1-.1c-.4-.5-1-.6-1.7-.6-1.5 0-2.8 1.1-3 2.7-.2.8 0 1.6.5 2.2.4.5 1.1.7 1.8.7 1.2 0 1.9-.8 1.9-.8v.3c0 .1 0 .2.2.2h1.2c.2 0 .3-.1.4-.3l.7-4.5c0-.1 0-.2-.2-.2h-.2Zm-1.8 2.6c-.1.7-.7 1.2-1.4 1.2-.4 0-.7-.1-.9-.3-.2-.2-.3-.5-.2-.9.1-.7.7-1.2 1.4-1.2.3 0 .6.1.8.3.2.3.3.6.3.9Z"
    />
    <path
      fill="#003087"
      d="M24.6 7.5H22c-.2 0-.3.1-.4.3l-1.1 6.7c0 .1 0 .2.2.2h1.4c.1 0 .2-.1.2-.2l.3-1.9c0-.2.2-.3.4-.3h.8c1.7 0 2.7-.8 3-2.5.1-.7 0-1.3-.3-1.7-.4-.4-1-.6-1.9-.6Zm.3 2.5c-.1.9-.8.9-1.5.9h-.4l.3-1.7c0-.1.1-.2.2-.2h.2c.5 0 .9 0 1.1.3.2.1.2.4.1.7Z"
    />
    <path
      fill="#009CDE"
      d="M30.6 10h-1.3c-.1 0-.2 0-.2.2v.3l-.1-.1c-.4-.5-1-.6-1.7-.6-1.5 0-2.8 1.1-3 2.7-.2.8 0 1.6.5 2.2.4.5 1.1.7 1.8.7 1.2 0 1.9-.8 1.9-.8v.3c0 .1.1.2.2.2h1.2c.2 0 .3-.1.4-.3l.7-4.5c0-.1 0-.2-.2-.2h-.2Zm-1.8 2.6c-.1.7-.7 1.2-1.4 1.2-.4 0-.7-.1-.9-.3-.2-.2-.3-.5-.2-.9.1-.7.7-1.2 1.4-1.2.3 0 .6.1.8.3.2.3.2.6.2.9Z"
    />
  </svg>
);

export function PaymentLogos() {
  return (
    <>
      <Visa />
      <Mastercard />
      <Amex />
      <PayPal />
    </>
  );
}
