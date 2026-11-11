// GET /api/health — liveness probe. Public, but reveals nothing beyond up/down.
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  try {
    const { error } = await supabaseServer().from('system_settings').select('id').limit(1);
    return NextResponse.json(
      { status: error ? 'degraded' : 'healthy', database: !error, responseTime: Date.now() - started, timestamp: new Date().toISOString() },
      { status: error ? 503 : 200 },
    );
  } catch {
    return NextResponse.json({ status: 'error', database: false, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
