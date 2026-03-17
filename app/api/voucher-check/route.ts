import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

const BASE_URL = 'https://beds24.com/api/v2';

// Cache vouchers in memoria per 1 ora
let voucherCache: { data: any[]; cachedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 ora

async function getVouchers(): Promise<any[]> {
  if (voucherCache && Date.now() - voucherCache.cachedAt < CACHE_TTL) {
    return voucherCache.data;
  }
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/properties?includeVoucherCodes=true`, {
    headers: { token },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GET /properties failed: ${res.status}`);
  const data = await res.json();
  const vouchers = data?.data?.[0]?.discountVouchers ?? [];
  voucherCache = { data: vouchers, cachedAt: Date.now() };
  return vouchers;
}

/**
 * GET /api/voucher-check?code=xxx&price=yyy
 * Verifica un voucher code e calcola il prezzo scontato.
 *
 * Risposta:
 *   { valid: true, type: "percent"|"fixedAmount", discount: 50, discountedPrice: 42.50 }
 *   { valid: false }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code')?.trim() ?? '';
  const price = Number(searchParams.get('price') ?? '0');

  if (!code) {
    return NextResponse.json({ valid: false, error: 'code mancante' }, { status: 400 });
  }

  try {
    const vouchers = await getVouchers();

    // Cerca il codice (case-insensitive, gestisce anche frasi multiple separate da virgola)
    const found = vouchers.find((v: any) => {
      const phrases = String(v.phrase ?? '').split(',').map((p: string) => p.trim().toLowerCase());
      return phrases.includes(code.toLowerCase());
    });

    if (!found) {
      return NextResponse.json({ valid: false });
    }

    let discountedPrice = price;
    if (found.type === 'percent') {
      discountedPrice = price * (1 - found.discount / 100);
    } else if (found.type === 'fixedAmount') {
      discountedPrice = Math.max(0, price - found.discount);
    }

    // Arrotonda a 2 decimali
    discountedPrice = Math.round(discountedPrice * 100) / 100;

    console.log('[voucher-check] code:', code, '→', found.type, found.discount, '| price:', price, '→', discountedPrice);

    return NextResponse.json({
      valid:           true,
      type:            found.type,
      discount:        found.discount,
      originalPrice:   price,
      discountedPrice,
    });

  } catch (err: any) {
    console.error('[voucher-check] Error:', err.message);
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
