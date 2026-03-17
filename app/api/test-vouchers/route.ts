import { NextResponse } from 'next/server';
import { getToken } from '@/lib/beds24-token';

export async function GET() {
  const BASE_URL = 'https://beds24.com/api/v2';
  try {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/properties?includeVoucherCodes=true`, {
      headers: { token },
      cache: 'no-store',
    });
    const data = await res.json();
    const text = JSON.stringify(data);
    const voucherIdx = text.toLowerCase().indexOf('voucher');
    return NextResponse.json({
      status: res.status,
      hasVoucher: voucherIdx >= 0,
      voucherContext: voucherIdx >= 0 ? text.slice(Math.max(0, voucherIdx - 50), voucherIdx + 300) : null,
      topLevelKeys: data?.data?.[0] ? Object.keys(data.data[0]) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}