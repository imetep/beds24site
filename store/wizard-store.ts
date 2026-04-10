import { create } from 'zustand';
import type { PoolType } from '@/config/properties';

export type PaymentMethod = 'stripe' | 'paypal';

// ─── Tipo upsell extra selezionato ───────────────────────────────────────────
export interface SelectedExtra {
  id: string;
  name: Record<string, string>;   // { it, en, de, pl }
  price: number;                  // prezzo unitario
  quantity: number;               // quante unità selezionate (1–4)
}

export interface WizardState {
  // Step 1 — Quante persone?
  numAdult: number;
  numChild: number;
  childrenAges: number[];

  // Step 2 — Quando?
  checkIn: string | null;
  checkOut: string | null;

  // Step 3 — Vuoi la piscina?
  poolPreference: PoolType;

  // Risultato filtro
  selectedRoomId: number | null;

  // Servizi extra opzionali (upsell items)
  selectedExtras: SelectedExtra[];

  // Step 5 → 6 — Offerte caricate da /api/offers
  cachedOffers: any[];

  // Step 6 — Riepilogo
  selectedOfferId: number | null;
  paymentMethod: PaymentMethod;
  voucherCode: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  guestArrivalTime: string;
  guestComments: string;

  // Prenotazione pendente
  pendingBookId: number | null;
  invoiceAmount: number | null;
  discountedPrice: number | null;

  // Navigazione
  currentStep: number;

  // Azioni
  setNumAdult: (n: number) => void;
  setNumChild: (n: number) => void;
  setChildAge: (index: number, age: number) => void;
  setCheckIn: (date: string) => void;
  setCheckOut: (date: string) => void;
  setPoolPreference: (pool: PoolType) => void;
  setSelectedRoomId: (id: number | null) => void;
  // qty=0 rimuove l'extra; qty>0 aggiunge o aggiorna la quantità
  setExtraQuantity: (extra: Omit<SelectedExtra, 'quantity'>, qty: number) => void;
  clearExtras: () => void;
  setSelectedOfferId: (id: number | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setVoucherCode: (code: string) => void;
  setOffers: (offers: any[]) => void;
  setGuestField: (field: string, value: string) => void;
  setPendingBooking: (bookId: number | null, invoiceAmount: number | null) => void;
  setDiscountedPrice: (price: number | null) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialState = {
  numAdult: 2,
  numChild: 0,
  childrenAges: [],
  checkIn: null,
  checkOut: null,
  poolPreference: 'none' as PoolType,
  selectedRoomId: null,
  selectedExtras: [] as SelectedExtra[],
  cachedOffers: [],
  selectedOfferId: null,
  paymentMethod: 'stripe' as PaymentMethod,
  voucherCode: '',
  guestFirstName: '',
  guestLastName: '',
  guestEmail: '',
  guestPhone: '',
  guestCountry: '',
  guestArrivalTime: '',
  guestComments: '',
  pendingBookId: null,
  invoiceAmount: null,
  discountedPrice: null,
  currentStep: 1,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setNumAdult: (n) => set({ numAdult: Math.max(1, n) }),

  setNumChild: (n) => set((state) => {
    const newN = Math.max(0, n);
    const ages = [...state.childrenAges];
    while (ages.length < newN) ages.push(-1);
    return { numChild: newN, childrenAges: ages.slice(0, newN) };
  }),

  setChildAge: (index, age) => set((state) => {
    const ages = [...state.childrenAges];
    ages[index] = age;
    return { childrenAges: ages };
  }),

  setCheckIn: (date) => set({ checkIn: date, checkOut: null }),
  setCheckOut: (date) => set({ checkOut: date }),
  setPoolPreference: (pool) => set({ poolPreference: pool, selectedRoomId: null }),
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),

  setExtraQuantity: (extra, qty) =>
    set((state) => {
      const filtered = state.selectedExtras.filter(e => e.id !== extra.id);
      if (qty <= 0) return { selectedExtras: filtered };
      return {
        selectedExtras: [...filtered, { ...extra, quantity: qty }],
      };
    }),

  clearExtras: () => set({ selectedExtras: [] }),

  setSelectedOfferId: (id) => set({ selectedOfferId: id }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setVoucherCode: (code) => set({ voucherCode: code }),
  setPendingBooking: (bookId, invoiceAmount) => set({ pendingBookId: bookId, invoiceAmount }),
  setDiscountedPrice: (price) => set({ discountedPrice: price }),
  setOffers: (offers) => set({ cachedOffers: offers }),
  setGuestField: (field, value) => set({ [field]: value } as any),
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(7, state.currentStep + 1) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  reset: () => set(initialState),
}));
