/**
 * <Icon name="..."/> — wrapper unico per tutte le icone del sito.
 *
 * Sostituisce il pattern `<i className="bi bi-XXX" />`. Mappa i nomi
 * Bootstrap Icons usati storicamente (senza prefisso `bi-`) ai
 * componenti equivalenti di lucide-react (outline 24x24 stroke=2).
 *
 * Per i loghi non presenti in Lucide (WhatsApp, PayPal, Google) sono
 * inclusi SVG inline custom mantenendo la stessa API.
 *
 * Default: size=24, strokeWidth=2, currentColor — stessa resa di
 * <i className="bi bi-XXX" /> dentro un parent con `color: …`.
 */
import {
  Accessibility, Apple, ArrowLeft, ArrowUpRight, Baby, Ban, Banknote, Box, Brush,
  Building, Calendar, CalendarDays, CalendarRange, CalendarX, Camera, Car, CarFront, ChefHat,
  Check, ChevronDown, ChevronUp, CircleAlert, CircleCheck, CircleHelp, CircleMinus,
  CircleSlash, CircleX, Clipboard, ClipboardList, Clock, Coffee, Coins, CookingPot,
  CreditCard, CupSoda, DoorClosed, Droplet, Egg, EggFried, Euro, FileImage, Flame,
  Flower, Globe, Heart, Home, Hourglass, Info, Landmark, Lightbulb, Link2, Lock,
  Mail, MapPin, Maximize2, MessageCircle, Microwave, Moon, MoonStar, Mountain,
  Newspaper, OctagonAlert, Pencil, Phone, RotateCw, Search, Shield, ShieldCheck,
  ShoppingBag, ShoppingBasket, SlidersHorizontal, Smile, Snowflake, SquareParking,
  Star, StickyNote, Sun, Tag, ThermometerSnowflake, Trash2, TreePine, TriangleAlert,
  Tv, Umbrella, User, Users, UtensilsCrossed, Waves, Wifi, Wind, X,
} from 'lucide-react';
import { forwardRef, type SVGProps, type Ref } from 'react';

/**
 * LucideProps locale — tipato esplicitamente come `SVGProps<SVGSVGElement>`
 * + extra di lucide-react (size, strokeWidth, absoluteStrokeWidth, ref).
 * Evita di dipendere dal type export di lucide-react, che in alcune
 * installazioni (es. node_modules non aggiornato) non si risolve e causa
 * cascade di errori TS2322 "Property 'className' does not exist" su tutte
 * le call site di <Icon>.
 */
type LucideProps = SVGProps<SVGSVGElement> & {
  size?: string | number;
  strokeWidth?: string | number;
  absoluteStrokeWidth?: boolean;
  ref?: Ref<SVGSVGElement>;
};

// ─── Mapping nome bi-* → componente Lucide ──────────────────────────────────
// Le versioni `*-fill` (Bootstrap Icons solid) e quelle outline puntano allo
// stesso componente Lucide (outline only) per design system uniforme.
const LUCIDE_MAP = {
  // Frecce / chevron
  'arrow-clockwise':   RotateCw,
  'arrow-left':        ArrowLeft,
  'arrow-up-right':    ArrowUpRight,
  'chevron-down':      ChevronDown,
  'chevron-up':        ChevronUp,
  // Stato / feedback
  'check':                        Check,
  'check-lg':                     Check,
  'check-circle-fill':            CircleCheck,
  'x-lg':                         X,
  'x-circle':                     CircleX,
  'x-circle-fill':                CircleX,
  'dash-circle':                  CircleMinus,
  'slash-circle':                 CircleSlash,
  'info-circle':                  Info,
  'info-circle-fill':             Info,
  'question-circle-fill':         CircleHelp,
  'exclamation-circle-fill':      CircleAlert,
  'exclamation-triangle-fill':    TriangleAlert,
  'exclamation-octagon-fill':     OctagonAlert,
  // Persone
  'people-fill':       Users,
  'person-fill':       User,
  'person-arms-up':    Baby,         // seggiolone
  'emoji-smile':       Smile,
  // Calendario / tempo
  'calendar-fill':     Calendar,
  'calendar-event':    CalendarDays,
  'calendar-range':    CalendarRange,
  'calendar-x-fill':   CalendarX,
  'clock':             Clock,
  'clock-fill':        Clock,
  'hourglass-split':   Hourglass,
  // Mappa / posizione
  'geo-alt-fill':      MapPin,
  'globe':             Globe,
  // Edifici / spazi
  'house-fill':        Home,
  'house-door-fill':   Home,
  'door-closed-fill':  DoorClosed,
  'building':          Building,
  'building-fill':     Building,
  'bank2':             Landmark,
  'p-square-fill':     SquareParking,
  // Natura / clima
  'sun-fill':          Sun,
  'moon-stars-fill':   MoonStar,
  'water':             Waves,
  'droplet-fill':      Droplet,
  'tree-fill':         TreePine,
  'flower1':           Flower,
  'snow':              Snowflake,
  'thermometer-snow':  ThermometerSnowflake,
  'wind':              Wind,
  'fire':              Flame,
  'umbrella-fill':     Umbrella,
  'triangle-fill':     Mountain,     // "vista montagna"
  // Cucina / elettrodomestici
  'cup':               UtensilsCrossed,
  'cup-fill':          Coffee,
  'cup-hot-fill':      CookingPot,
  'cup-straw':         CupSoda,
  'egg-fill':          Egg,
  'egg-fried':         EggFried,
  'bread-slice':       ChefHat,
  'broadcast':         Microwave,
  'oven':              Flame,
  'box-fill':          Box,
  'basket2-fill':      ShoppingBasket,
  'tv-fill':           Tv,
  'wifi':              Wifi,
  'lightning-fill':    Flame,        // consumi (fiamma per energia)
  // Moneta / pagamento
  'cash-coin':         Coins,
  'cash-stack':        Banknote,
  'credit-card':           CreditCard,
  'credit-card-fill':      CreditCard,
  'credit-card-2-back-fill':  CreditCard,
  'credit-card-2-front-fill': CreditCard,
  'tag-fill':          Tag,
  // Sicurezza
  'lock':              Lock,
  'lock-fill':         Lock,
  'shield-fill':       Shield,
  'shield-lock-fill':  ShieldCheck,
  // Comunicazione
  'chat-fill':         MessageCircle,
  'envelope-fill':     Mail,
  'telephone-fill':    Phone,
  // Documenti / liste
  'card-list':         ClipboardList,
  'clipboard-fill':    Clipboard,
  'sticky-fill':       StickyNote,
  'newspaper':         Newspaper,
  'file-earmark-image': FileImage,
  'pencil-fill':       Pencil,
  // Acquisti / accessori
  'bag-fill':          ShoppingBag,
  'bag-plus-fill':     ShoppingBag,
  'heart-fill':        Heart,
  'star-fill':         Star,
  'lightbulb-fill':    Lightbulb,
  'camera-fill':       Camera,
  'brush-fill':        Brush,
  'aspect-ratio':      Maximize2,
  'sliders':           SlidersHorizontal,
  'search':            Search,
  'link-45deg':        Link2,
  'trash':             Trash2,
  'universal-access':  Accessibility,
  'apple':             Apple,
  // Mezzi
  'car-front-fill':    CarFront,
  'car-fill':          Car,
  // Valuta
  'currency-euro':     Euro,
  // Catch-all per icone usate non comuni
  'ban':               Ban,
  'moon':              Moon,
} satisfies Record<string, React.ComponentType<LucideProps>>;

// ─── Loghi brand non presenti in Lucide (SVG inline custom) ─────────────────
const Whatsapp = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" stroke="none" aria-hidden {...rest}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
);
Whatsapp.displayName = 'Whatsapp';

const Paypal = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" stroke="none" aria-hidden {...rest}>
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 1.183A.641.641 0 0 1 5.577.642h6.964c2.396 0 4.243.604 5.392 1.778 1.085 1.107 1.43 2.518 1.062 4.404l-.018.115v.836l.396.226c.452.255.815.554 1.094.91.38.486.624 1.084.725 1.78.108.732.092 1.61-.061 2.587-.16 1.103-.401 2.064-.715 2.853-.291.731-.677 1.358-1.144 1.85a4.785 4.785 0 0 1-1.661 1.157c-.62.275-1.353.466-2.183.566-.788.097-1.704.146-2.722.146h-.7c-.518 0-1.02.184-1.412.518a2.16 2.16 0 0 0-.747 1.292l-.052.27-.578 3.668-.027.135c-.008.043-.018.064-.034.078a.087.087 0 0 1-.054.018"/>
    </svg>
  )
);
Paypal.displayName = 'Paypal';

const Google = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, ...rest }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" stroke="none" aria-hidden {...rest}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
);
Google.displayName = 'Google';

const BRAND_MAP = {
  whatsapp: Whatsapp,
  paypal:   Paypal,
  google:   Google,
} satisfies Record<string, React.ComponentType<LucideProps>>;

// ─── Tipi pubblici ──────────────────────────────────────────────────────────
export type IconName = keyof typeof LUCIDE_MAP | keyof typeof BRAND_MAP;

export interface IconProps extends LucideProps {
  name: IconName;
}

// ─── Componente Icon ────────────────────────────────────────────────────────
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, size = 24, strokeWidth = 2, ...rest },
  ref,
) {
  const Comp =
    (LUCIDE_MAP as Record<string, React.ComponentType<LucideProps>>)[name] ||
    (BRAND_MAP as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Comp) return null;
  return (
    <Comp
      ref={ref}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
      {...rest}
    />
  );
});
