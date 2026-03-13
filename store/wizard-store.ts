import { create } from 'zustand';

export type AccommodationType = 'appartamento' | 'casa' | 'villa' | null;
export type PropertyGroup = 'campagna' | 'mare' | null;

export interface WizardState {
  // Step 1
  numAdult: number;
  numChild: number;

  // Step 2
  checkIn: string | null;   // formato YYYY-MM-DD
  checkOut: string | null;  // formato YYYY-MM-DD

  // Step 3
  accommodationType: AccommodationType;

  // Step 4
  propertyGroup: PropertyGroup;
  selectedRoomId: string | null;

  // Step 5
  selectedExtras: string[]; // lista di extra IDs selezionati

  // Step 6
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  guestArrivalTime: string;
  guestComments: string;
  voucherCode: string;

  // Navigazione
  currentStep: number;

  // Azioni
  setNumAdult: (n: number) => void;
  setNumChild: (n: number) => void;
  setCheckIn: (date: string) => void;
  setCheckOut: (date: string) => void;
  setAccommodationType: (type: AccommodationType) => void;
  setPropertyGroup: (group: PropertyGroup) => void;
  setSelectedRoomId: (id: string) => void;
  toggleExtra: (id: string) => void;
  setGuestField: (field: string, value: string) => void;
  setVoucherCode: (code: string) => void;
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
  accommodationType: null,
  propertyGroup: null,
  selectedRoomId: null,
  selectedExtras: [],
  guestFirstName: '',
  guestLastName: '',
  guestEmail: '',
  guestPhone: '',
  guestCountry: '',
  guestArrivalTime: '',
  guestComments: '',
  voucherCode: '',
  currentStep: 1,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setNumAdult: (n) => set({ numAdult: Math.max(1, n) }),
  setNumChild: (n) => set({ numChild: Math.max(0, n) }),
  setCheckIn: (date) => set({ checkIn: date, checkOut: null }),
  setCheckOut: (date) => set({ checkOut: date }),
  setAccommodationType: (type) => set({ accommodationType: type }),
  setPropertyGroup: (group) => set({ propertyGroup: group }),
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),
  toggleExtra: (id) => set((state) => ({
    selectedExtras: state.selectedExtras.includes(id)
      ? state.selectedExtras.filter((e) => e !== id)
      : [...state.selectedExtras, id],
  })),
  setGuestField: (field, value) => set({ [field]: value } as any),
  setVoucherCode: (code) => set({ voucherCode: code }),
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(6, state.currentStep + 1) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  reset: () => set(initialState),
}));
