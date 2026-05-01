'use client';
import { useState, useEffect, useRef } from 'react';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

type Tab = 'plane' | 'train' | 'car';

// ─── Icone SVG inline (stile Lucide outline, 24×24, stroke 2) ────────────────
const SVG_PROPS = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};
const IconSea       = () => <svg {...SVG_PROPS}><path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>;
const IconLocation  = () => <svg {...SVG_PROPS}><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconClimate   = () => <svg {...SVG_PROPS}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const IconNature    = () => <svg {...SVG_PROPS}><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg>;
const IconPlane     = () => <svg {...SVG_PROPS}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>;
const IconTrain     = () => <svg {...SVG_PROPS}><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/></svg>;
const IconCar       = () => <svg {...SVG_PROPS}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>;
const IconWarning   = () => <svg {...SVG_PROPS}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
const IconInfo      = () => <svg {...SVG_PROPS}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;

// ─── Mappa Italia ────────────────────────────────────────────────────────────
const CITIES = [
  { id: 'roma',    x: 392, y: 506, label: 'Roma',    time: '~2h',      byPlane: false },
  { id: 'napoli',  x: 512, y: 633, label: 'Napoli',  time: '~1h 15min',byPlane: false },
  { id: 'firenze', x: 376, y: 372, label: 'Firenze', time: '~4h',      byPlane: false },
  { id: 'venezia', x: 430, y: 163, label: 'Venezia', time: '~6h',      byPlane: false },
  { id: 'milano',  x: 181, y: 137, label: 'Milano',  time: '~6h 30min',byPlane: false },
  { id: 'palermo', x: 464, y: 846, label: 'Palermo', time: '~1h',      byPlane: true  },
  { id: 'bari',    x: 709, y: 569, label: 'Bari',    time: '~3h 45min',byPlane: false },
];

const LABEL_OFFSET: Record<string, { ax: number; ay: number; anchor: string }> = {
  roma:    { ax: -15, ay: -5,  anchor: 'end'    },
  napoli:  { ax: +15, ay: +4,  anchor: 'start'  },
  firenze: { ax: -15, ay: -5,  anchor: 'end'    },
  venezia: { ax: -15, ay: -8,  anchor: 'end'    },
  milano:  { ax: -15, ay: -5,  anchor: 'end'    },
  palermo: { ax:   0, ay: +22, anchor: 'middle' },
  bari:    { ax: +15, ay: +4,  anchor: 'start'  },
};

const ITALY_PATH = `M3320 9880 c-8 -5 -32 -10 -53 -10 -105 0 -178 -45 -221 -135 -14
-30 -29 -55 -33 -55 -5 0 -27 14 -51 30 -55 37 -111 45 -223 32 -114 -12 -130
-26 -166 -139 -22 -72 -29 -84 -52 -89 -99 -23 -136 -35 -157 -55 -27 -25 -54
-104 -54 -155 0 -17 -6 -36 -12 -42 -7 -5 -50 -16 -95 -24 -99 -18 -108 -14
-117 57 -10 77 -28 89 -139 93 -155 5 -184 -26 -186 -196 -1 -93 -15 -125 -85
-190 -46 -43 -60 -52 -79 -46 -12 4 -44 13 -72 20 -50 13 -60 22 -117 100 -24
32 -28 46 -28 109 0 133 -31 165 -148 150 -79 -10 -106 -27 -139 -87 -21 -40
-39 -58 -73 -76 -74 -37 -85 -53 -87 -132 -2 -90 -38 -162 -96 -192 -36 -18
-45 -19 -104 -8 -85 16 -143 7 -212 -32 -54 -32 -61 -33 -166 -34 -144 -1
-139 0 -174 -29 -16 -14 -51 -33 -76 -42 -65 -22 -79 -57 -72 -175 7 -102 21
-135 76 -171 34 -22 43 -37 57 -84 10 -35 30 -73 51 -96 49 -55 43 -73 -47
-124 -59 -33 -85 -42 -122 -43 l-48 0 0 -199 0 -199 41 -31 c23 -16 54 -33 70
-36 51 -11 47 -44 -17 -155 -28 -48 -28 -48 -6 -233 7 -55 16 -87 31 -105 12
-15 32 -43 45 -62 31 -46 44 -57 96 -75 24 -9 65 -29 90 -44 49 -32 137 -61
182 -61 35 0 36 -20 7 -75 -38 -74 -7 -215 55 -244 57 -27 320 19 429 75 91
47 114 71 169 179 50 100 55 107 102 128 44 19 53 29 77 82 32 72 48 87 118
115 61 24 100 19 234 -26 71 -24 211 -110 277 -169 19 -17 73 -53 119 -79 68
-39 96 -49 153 -55 66 -7 71 -10 119 -57 41 -41 52 -61 64 -110 8 -32 14 -81
15 -109 0 -67 25 -207 43 -242 8 -15 25 -37 37 -48 13 -11 41 -58 62 -105 32
-69 39 -92 34 -125 -3 -22 -8 -60 -11 -85 -4 -25 -8 -55 -11 -67 -5 -28 -70
-63 -116 -63 -102 0 -145 -38 -157 -136 -5 -38 -17 -89 -26 -114 -18 -49 -14
-120 9 -139 21 -18 101 -24 139 -12 36 12 51 38 59 101 3 24 5 25 73 23 125
-5 144 10 160 130 4 31 11 47 21 47 8 0 14 -9 14 -20 0 -43 28 -79 73 -91 87
-23 99 -32 138 -92 58 -89 52 -109 -35 -121 -63 -8 -74 -18 -82 -73 -10 -70 9
-121 54 -140 42 -17 108 -13 163 10 49 21 184 37 224 26 40 -11 102 -59 130
-102 12 -18 32 -59 45 -91 33 -84 69 -121 130 -136 74 -18 151 -87 195 -177
28 -59 43 -76 74 -93 21 -10 48 -34 59 -52 11 -18 35 -46 52 -63 18 -16 49
-53 70 -80 33 -44 47 -54 121 -82 46 -17 100 -37 120 -43 43 -13 61 -31 83
-83 26 -64 94 -81 212 -51 62 15 62 15 115 -11 39 -20 74 -29 133 -33 67 -4
83 -9 102 -29 17 -18 78 -129 102 -185 2 -4 -12 -15 -32 -25 -44 -21 -61 -64
-53 -141 9 -81 19 -87 136 -86 l99 2 4 -55 c7 -79 29 -98 116 -98 54 0 81 7
137 32 44 20 94 34 136 38 61 6 69 4 88 -16 36 -39 44 -81 30 -158 -6 -38 -9
-84 -5 -104 9 -46 86 -122 145 -142 27 -9 67 -37 106 -74 72 -70 120 -87 205
-76 30 4 66 8 79 9 37 2 62 -49 72 -147 14 -123 42 -203 95 -272 72 -94 86
-134 94 -265 8 -117 31 -202 66 -241 27 -30 11 -45 -53 -52 -54 -5 -61 -9 -99
-52 -55 -62 -66 -120 -43 -222 10 -41 9 -54 -5 -81 -18 -36 -30 -39 -136 -45
-60 -3 -86 -9 -122 -31 -38 -22 -57 -27 -100 -24 l-53 3 -7 54 c-7 60 -24 107
-71 201 -29 58 -36 65 -72 74 -27 6 -62 5 -108 -2 -37 -7 -95 -12 -130 -12
-38 0 -77 -7 -102 -19 -23 -10 -62 -21 -87 -25 -26 -4 -52 -14 -59 -23 -17
-20 -17 -116 -1 -136 18 -22 80 -30 132 -18 25 5 80 11 122 13 70 3 79 1 103
-22 53 -49 72 -120 38 -138 -10 -5 -34 -12 -54 -16 -20 -4 -54 -20 -75 -37
-55 -44 -80 -55 -158 -69 -47 -9 -110 -11 -192 -7 -93 5 -134 3 -171 -8 -76
-23 -92 -20 -137 29 -23 25 -54 48 -71 52 -16 4 -49 24 -71 45 -62 56 -124 60
-286 18 -23 -6 -47 -22 -60 -39 -12 -17 -26 -30 -32 -30 -5 0 -22 15 -37 32
-26 32 -30 33 -98 33 -71 0 -71 0 -109 -42 -41 -47 -139 -103 -181 -103 -14
-1 -44 -8 -66 -16 -22 -9 -74 -17 -116 -17 -46 -1 -82 -7 -92 -15 -22 -19 -31
-85 -17 -128 13 -40 55 -64 111 -64 40 0 135 -27 147 -43 5 -7 17 -41 26 -77
21 -81 38 -108 81 -126 19 -7 46 -29 60 -48 35 -46 77 -59 164 -50 66 6 72 5
101 -20 18 -14 50 -29 73 -32 33 -6 52 -18 92 -59 56 -59 145 -120 190 -131
17 -3 53 -24 80 -45 82 -62 184 -99 295 -108 78 -6 103 -12 137 -34 55 -35 92
-83 123 -158 24 -58 29 -64 90 -95 l64 -34 263 0 263 0 0 77 0 77 58 55 57 54
-1 71 c0 54 -6 84 -26 127 -14 30 -28 77 -32 104 -6 37 -15 55 -42 78 -19 17
-34 37 -34 46 0 8 13 51 29 95 16 45 35 99 41 121 15 56 80 148 112 159 20 7
37 5 70 -10 36 -16 66 -19 204 -19 214 0 205 -5 264 151 36 96 81 152 186 229
40 30 81 69 90 87 12 22 20 80 28 184 12 170 14 175 96 222 41 24 55 27 150
27 61 1 114 6 126 13 49 27 77 159 49 232 -10 25 -23 109 -31 187 -7 78 -19
153 -26 166 -17 33 -90 93 -148 122 -25 13 -65 39 -89 59 -31 26 -56 37 -92
42 -80 11 -97 46 -48 100 23 25 39 76 39 125 0 22 9 47 22 64 12 16 49 80 83
143 33 65 72 124 88 136 l27 20 38 -36 c74 -71 173 -107 323 -117 64 -5 121
-11 127 -15 19 -12 92 -165 92 -194 0 -59 20 -99 78 -154 69 -66 107 -80 222
-82 75 -1 92 2 117 20 l28 21 3 290 2 291 -71 68 c-39 38 -90 81 -113 96 -31
19 -48 39 -60 70 -24 60 -58 92 -129 123 -34 14 -73 33 -87 41 -27 17 -100 50
-170 80 -25 10 -78 50 -120 89 -103 98 -191 148 -384 217 -60 21 -164 67 -231
101 -160 82 -199 98 -263 113 -59 14 -92 37 -92 65 0 10 31 42 73 74 39 32 78
68 85 81 39 73 15 242 -39 288 -42 36 -94 40 -316 26 -109 -7 -243 -12 -298
-11 -96 2 -101 3 -153 38 -29 19 -81 46 -114 59 -73 28 -94 46 -108 90 -8 24
-30 46 -78 80 -37 26 -108 86 -157 133 -50 47 -117 105 -148 129 -32 23 -64
57 -72 75 -39 87 -95 240 -95 257 0 11 -10 46 -21 78 -12 31 -31 93 -44 137
-12 44 -36 107 -52 140 -17 33 -40 95 -52 138 -26 96 -66 194 -88 219 -9 10
-46 27 -82 38 -90 27 -124 50 -239 161 -131 127 -161 148 -240 174 -55 17 -71
28 -87 55 -11 19 -51 64 -89 100 -38 36 -79 82 -92 102 -31 48 -51 135 -64
267 -10 92 -9 106 6 122 10 11 23 19 30 19 19 0 73 48 89 80 19 37 30 168 16
202 -5 15 -30 39 -53 54 -24 15 -45 28 -47 31 -3 2 -8 31 -12 64 -5 40 -16 73
-33 98 -42 61 -30 91 36 91 21 0 66 9 100 21 75 25 236 104 264 130 11 11 49
30 85 44 40 16 74 37 90 57 26 31 26 31 73 18 29 -8 67 -10 104 -6 73 8 88 3
111 -43 27 -51 51 -70 102 -77 58 -8 119 9 150 42 20 22 24 36 24 88 0 56 -4
69 -42 127 -23 35 -55 72 -70 81 -68 40 -80 60 -88 145 -5 62 -3 87 8 109 21
42 30 91 22 130 -4 25 -16 41 -45 61 -22 14 -40 34 -40 43 0 10 22 34 50 54
39 28 51 44 61 78 23 89 -7 166 -75 187 -35 11 -155 30 -261 41 -95 10 -193
27 -295 50 -47 11 -112 24 -145 29 -122 19 -161 50 -221 178 -32 67 -35 79
-29 128 l7 55 -353 0 c-211 0 -360 -4 -369 -10z M2203 5963 c-37 -7 -48 -31
-48 -109 0 -93 12 -108 89 -108 68 -1 92 19 102 81 16 109 -35 157 -143 136z
M2543 5283 c-12 -2 -27 -11 -35 -20 -17 -21 -17 -135 0 -156 18 -22 85 -31
126 -17 50 16 69 79 45 148 -15 43 -64 59 -136 45z M1763 4239 c-18 -5 -44
-25 -58 -44 -15 -19 -46 -45 -69 -59 -37 -22 -62 -46 -165 -161 -27 -31 -176
-103 -187 -92 -4 3 -1 35 7 71 18 91 3 141 -49 163 -44 18 -126 12 -152 -12
-28 -25 -70 -129 -76 -187 -3 -29 -13 -73 -22 -98 -13 -34 -17 -80 -17 -192 0
-170 2 -175 83 -185 69 -8 88 -30 95 -110 3 -39 13 -73 25 -90 34 -49 35 -68
6 -102 -21 -25 -28 -48 -36 -114 -11 -95 -5 -143 22 -198 24 -46 27 -151 6
-221 -8 -26 -17 -80 -21 -120 -9 -110 -12 -116 -54 -138 -83 -42 -82 -161 2
-260 23 -27 51 -61 62 -75 15 -19 33 -27 70 -31 41 -5 56 -12 82 -42 l32 -36
100 -4 c146 -6 185 2 236 49 58 54 94 109 109 166 8 30 18 49 29 51 9 2 44
-16 78 -39 55 -39 67 -43 119 -44 48 0 63 4 83 24 61 56 127 318 112 437 -5
34 -2 67 9 104 11 35 16 92 16 166 0 73 5 126 15 154 17 49 19 108 4 165 -6
22 -13 50 -16 63 -3 14 3 33 19 55 52 68 71 119 76 202 3 59 -1 92 -13 125
-24 66 -34 107 -44 183 -7 48 -17 78 -35 102 -14 18 -26 42 -26 53 0 51 -14
85 -41 101 -21 11 -33 30 -44 66 l-14 50 -113 54 c-119 57 -182 70 -245 50z
M4414 3964 c-45 -10 -59 -40 -59 -125 0 -99 11 -113 91 -113 47 0 60 4 75 23
40 49 49 172 15 200 -15 13 -91 22 -122 15z M5983 2004 c-35 -8 -48 -33 -48
-95 0 -82 23 -104 105 -104 80 0 95 15 95 95 0 46 -5 64 -20 80 -21 20 -90 33
-132 24z M4548 1919 c-33 -13 -53 -65 -43 -117 9 -49 19 -59 65 -67 61 -10
107 9 120 51 13 39 5 107 -14 123 -19 16 -97 22 -128 10z M3678 249 c-56 -22
-63 -149 -13 -215 l26 -34 92 0 c106 0 114 6 123 88 7 58 -13 119 -46 143 -30
22 -143 33 -182 18z`;

function ItalyMap({ byCarLabel, byPlaneLabel }: { byCarLabel: string; byPlaneLabel: string }) {
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [drawingIndex, setDrawingIndex] = useState<number>(-1);

  useEffect(() => {
    let step = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      setVisibleCount(0);
      setDrawingIndex(-1);

      const showNext = () => {
        if (!running) return;
        if (step >= CITIES.length) {
          animRef.current = setTimeout(() => {
            step = 0;
            animate();
          }, 2500);
          return;
        }
        const current = step;
        setDrawingIndex(current);
        animRef.current = setTimeout(() => {
          if (!running) return;
          setVisibleCount(current + 1);
          step = current + 1;
          animRef.current = setTimeout(showNext, 600);
        }, 900);
      };

      animRef.current = setTimeout(showNext, 400);
    };

    animate();
    return () => {
      running = false;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const lineLen = (city: typeof CITIES[0]) =>
    Math.sqrt((city.x - 480) ** 2 + (city.y - 577) ** 2);

  return (
    <svg
      viewBox="0 0 836 989"
      className="dove-siamo__map-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(0,989) scale(0.1,-0.1)">
        <path d={ITALY_PATH} className="dove-siamo__map-italy" />
      </g>

      {CITIES.map((city, i) => {
        const ll = lineLen(city);
        const isDrawing = drawingIndex === i;
        const isVisible = i < visibleCount;
        return (
          <line
            key={city.id}
            x1={480} y1={577} x2={city.x} y2={city.y}
            className="dove-siamo__map-line"
            strokeDasharray={city.byPlane ? `6 4 ${ll}` : `${ll}`}
            strokeDashoffset={isDrawing || isVisible ? 0 : ll}
            opacity={isDrawing || isVisible ? 1 : 0}
            style={isDrawing ? { transition: 'stroke-dashoffset 0.85s ease, opacity 0.1s' } : undefined}
          />
        );
      })}

      {CITIES.map((city, i) => {
        const lbl = LABEL_OFFSET[city.id];
        const isVisible = i < visibleCount;
        const modeLabel = city.byPlane ? byPlaneLabel : byCarLabel;
        return (
          <g key={city.id} opacity={isVisible ? 1 : 0} className="dove-siamo__city-anim">
            <circle cx={city.x} cy={city.y} r={6} className="dove-siamo__map-dot" />
            <text
              x={city.x + lbl.ax} y={city.y + lbl.ay - 9}
              textAnchor={lbl.anchor as 'start' | 'end' | 'middle'}
              className="dove-siamo__map-label"
            >
              {city.label}
            </text>
            <text
              x={city.x + lbl.ax} y={city.y + lbl.ay + 8}
              textAnchor={lbl.anchor as 'start' | 'end' | 'middle'}
              className="dove-siamo__map-time"
            >
              {city.time} {modeLabel}
            </text>
          </g>
        );
      })}

      <circle cx={480} cy={577} r={16} className="dove-siamo__map-pin-halo" />
      <circle cx={480} cy={577} r={9}  className="dove-siamo__map-pin" />
      <circle cx={480} cy={577} r={4}  className="dove-siamo__map-pin-core" />
      <text x={496} y={570} className="dove-siamo__map-pin-label">Scauri</text>
    </svg>
  );
}

// ─── Componente principale ──────────────────────────────────────────────────
export default function DoveSiamoClient({ locale }: { locale: Locale }) {
  const t = getTranslations(locale).components.doveSiamo;
  const [activeTab, setActiveTab] = useState<Tab>('car');
  const homeHref = `/${locale}`;

  const pills = [
    { Icon: IconSea,      title: t.pillSeaTitle,      text: t.pillSeaText      },
    { Icon: IconLocation, title: t.pillLocationTitle, text: t.pillLocationText },
    { Icon: IconClimate,  title: t.pillClimateTitle,  text: t.pillClimateText  },
    { Icon: IconNature,   title: t.pillNatureTitle,   text: t.pillNatureText   },
  ];

  const tabs: { id: Tab; label: string; Icon: () => React.ReactElement }[] = [
    { id: 'plane', label: t.tabPlane, Icon: IconPlane },
    { id: 'train', label: t.tabTrain, Icon: IconTrain },
    { id: 'car',   label: t.tabCar,   Icon: IconCar   },
  ];

  return (
    <main className="dove-siamo">

      {/* Hero */}
      <section className="dove-siamo__hero">
        <h1 className="section-title-main">{t.heroTitle}</h1>
        <p className="dove-siamo__hero-sub">{t.heroSub}</p>
      </section>

      {/* Perché Scauri */}
      <section className="dove-siamo__section">
        <h2 className="dove-siamo__section-title">{t.whyTitle}</h2>
        <div className="dove-siamo__pills">
          {pills.map((p, i) => (
            <div key={i} className="dove-siamo__pill">
              <span className="dove-siamo__pill-icon"><p.Icon /></span>
              <strong className="dove-siamo__pill-title">{p.title}</strong>
              <p className="dove-siamo__pill-text">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mappa */}
      <section className="dove-siamo__section">
        <h2 className="dove-siamo__section-title">{t.mapTitle}</h2>
        <p className="dove-siamo__section-sub">{t.mapSub}</p>
        <ItalyMap byCarLabel={t.byCar} byPlaneLabel={t.byPlane} />
      </section>

      {/* Come raggiungerci */}
      <section className="dove-siamo__section">
        <h2 className="dove-siamo__section-title">{t.howTitle}</h2>

        <div className="dove-siamo__tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`dove-siamo__tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="dove-siamo__tab-icon"><tab.Icon /></span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'plane' && (
          <div className="dove-siamo__tab-panel">
            <p className="dove-siamo__tab-intro">{t.planeIntro}</p>
            <ul className="dove-siamo__list">
              {t.planeAirports.map((ap) => (
                <li key={ap.code} className="dove-siamo__list-item">
                  <span className="dove-siamo__airport-code">{ap.code}</span>
                  <span className="dove-siamo__list-main">{ap.name}</span>
                  <span className="dove-siamo__list-meta">{ap.km}</span>
                  <span className="dove-siamo__list-badge">{ap.time}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'train' && (
          <div className="dove-siamo__tab-panel">
            <p className="dove-siamo__tab-intro">{t.trainIntro}</p>
            <ul className="dove-siamo__list">
              {t.trainRoutes.map((route, i) => (
                <li key={i} className="dove-siamo__list-item">
                  <span className="dove-siamo__list-icon"><IconTrain /></span>
                  <span className="dove-siamo__list-main">{route.label}</span>
                  <span className="dove-siamo__list-badge">{route.time}</span>
                </li>
              ))}
            </ul>
            <p className="dove-siamo__note">
              <span className="dove-siamo__note-icon"><IconInfo /></span>
              {t.trainNote}
            </p>
          </div>
        )}

        {activeTab === 'car' && (
          <div className="dove-siamo__tab-panel">
            <p className="dove-siamo__tab-intro">{t.carIntro}</p>
            <div className="dove-siamo__cars">
              {t.carFrom.map((item, i) => (
                <div key={i} className="dove-siamo__car-card">
                  <div className="dove-siamo__car-icon"><IconCar /></div>
                  <p className="dove-siamo__car-city">{item.city}</p>
                  <p className="dove-siamo__car-time">{item.time}</p>
                  <p className="dove-siamo__car-detail">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="banner banner--warning banner--with-icon dove-siamo__callout">
              <span className="dove-siamo__callout-icon"><IconWarning /></span>
              <div>
                <p className="banner__title">{t.carNoteTitle}</p>
                <p className="banner__text">{t.carNote}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CTA finale */}
      <section className="dove-siamo__section dove-siamo__cta">
        <h2 className="dove-siamo__section-title">{t.ctaTitle}</h2>
        <p className="dove-siamo__section-sub">{t.ctaSub}</p>
        <a href={homeHref} className="cta-book">{t.ctaBtn}</a>
      </section>

    </main>
  );
}
