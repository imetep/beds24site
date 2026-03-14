import { create } from 'zustand';
import type { PoolType } from '@/config/properties';

export interface WizardState {
  // Step 1 — Quante persone?
  numAdult: number;
  numChild: number;

  // Step 2 — Quando?
  checkIn: string | null;   // formato YYYY-MM-DD
  checkOut: string | null;  // formato YYYY-MM-DD

  // Step 3 — Vuoi la piscina?
  poolPreference: PoolType; // 'none' | 'private' | 'shared'

  // Risultato filtro (calcolato da Step 1 + Step 3)
  selectedRoomId: number | null;

  // Step 4 — Servizi extra
  selectedExtras: string[];

  // Step 5 — Quanti under 12?
  numUnder12: number; // per calcolo imposta di soggiorno

  // Step 5 → 6 — Offerte caricate da /api/offers (cache locale, evita doppia chiamata)
  cachedOffers: any[];  // Beds24Offer[]

  // Step 6 — Riepilogo
  selectedOfferId: number | null;
  voucherCode: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  guestArrivalTime: string;
  guestComments: string;

  // Navigazione
  currentStep: number;

  // Azioni
  setNumAdult: (n: number) => void;
  setNumChild: (n: number) => void;
  setCheckIn: (date: string) => void;
  setCheckOut: (date: string) => void;
  setPoolPreference: (pool: PoolType) => void;
  setSelectedRoomId: (id: number | null) => void;
  toggleExtra: (id: string) => void;
  setNumUnder12: (n: number) => void;
  setSelectedOfferId: (id: number | null) => void;
  setVoucherCode: (code: string) => void;
  setOffers: (offers: any[]) => void;
  setGuestField: (field: string, value: string) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialState = {
  numAdult: 2,
  numChild: 0,
  checkIn: null,
  checkOut: null,
  poolPreference: 'none' as PoolType,
  selectedRoomId: null,
  selectedExtras: [],
  numUnder12: 0,
  cachedOffers: [],
  selectedOfferId: null,
  voucherCode: '',
  guestFirstName: '',
  guestLastName: '',
  guestEmail: '',
  guestPhone: '',
  guestCountry: '',
  guestArrivalTime: '',
  guestComments: '',
  currentStep: 1,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setNumAdult: (n) => set({ numAdult: Math.max(1, n) }),
  setNumChild: (n) => set({ numChild: Math.max(0, n) }),
  setCheckIn: (date) => set({ checkIn: date, checkOut: null }),
  setCheckOut: (date) => set({ checkOut: date }),
  setPoolPreference: (pool) => set({ poolPreference: pool, selectedRoomId: null }),
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),
  toggleExtra: (id) =>
    set((state) => ({
      selectedExtras: state.selectedExtras.includes(id)
        ? state.selectedExtras.filter((e) => e !== id)
        : [...state.selectedExtras, id],
    })),
  setNumUnder12: (n) => set((state) => ({ numUnder12: Math.min(Math.max(0, n), state.numAdult) })),
  setSelectedOfferId: (id) => set({ selectedOfferId: id }),
  setVoucherCode: (code) => set({ voucherCode: code }),
  setOffers: (offers) => set({ cachedOffers: offers }),
  setGuestField: (field, value) => set({ [field]: value } as any),
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(6, state.currentStep + 1) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  reset: () => set(initialState),
}));
