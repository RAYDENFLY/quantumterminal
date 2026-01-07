import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'IMGBB_API_KEY is not set' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 });
    }

    // ImgBB accepts base64-encoded image content.
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const url = new URL('https://api.imgbb.com/1/upload');
    url.searchParams.set('key', apiKey);

    const body = new FormData();
    body.set('image', base64);

    const res = await fetch(url.toString(), { method: 'POST', body });
    const json = (await res.json().catch(() => null)) as any;

    if (!res.ok || !json?.success) {
      return NextResponse.json(
        { success: false, error: 'ImgBB upload failed', details: json },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: json.data?.url as string,
        thumbUrl: json.data?.thumb?.url as string | undefined,
        deleteUrl: json.data?.delete_url as string | undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
