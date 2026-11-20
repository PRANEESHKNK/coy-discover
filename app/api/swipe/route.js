import { NextResponse } from 'next/server';
import { recordSwipe } from '../../../lib/db.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { body = null; }
  const { profileId, action } = body || {};
  if (typeof profileId !== 'string' || !['like', 'pass'].includes(action)) {
    return NextResponse.json({ error: 'Send { profileId: string, action: "like" | "pass" }.' }, { status: 400 });
  }
  const { status, body: out } = recordSwipe(profileId, action);
  return NextResponse.json(out, { status });
}
