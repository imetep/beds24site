import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    const bookId   = formData.get('bookId') as string | null;
    const label    = formData.get('label') as string | null; // es. "ospite1_fronte"

    if (!file || !bookId) {
      return NextResponse.json({ error: 'file e bookId obbligatori' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder:         `livingapple/checkin/${bookId}`,
      public_id:      label ?? `doc_${Date.now()}`,
      resource_type:  'image',
      type:           'upload',      // accessibile con URL diretto
      overwrite:      true,
    });

    return NextResponse.json({
      ok:        true,
      publicId:  result.public_id,
      secureUrl: result.secure_url,
    });

  } catch (err: any) {
    console.error('[checkin/upload]', err);
    return NextResponse.json({ error: err.message ?? 'Upload fallito' }, { status: 500 });
  }
}
