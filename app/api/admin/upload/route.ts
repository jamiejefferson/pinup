import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/upload - Generate a signed upload URL for direct browser upload
 * Accepts JSON with:
 * - filename: Original filename (used for temp path)
 */
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await request.json();
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const tempPath = `temp-uploads/${crypto.randomUUID()}/${filename}`;
    const supabase = getSupabase();

    const { data, error } = await supabase.storage
      .from('Prototypes')
      .createSignedUploadUrl(tempPath, { upsert: true });

    if (error) {
      console.error('Failed to create signed upload URL:', error);
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
