import { NextResponse } from 'next/server';
import { resetDb } from '../../../lib/db.js';

export const dynamic = 'force-dynamic';

// Demo helper: restores the 36 seeded profiles and clears all swipes and matches.
export async function POST() {
  resetDb();
  return NextResponse.json({ ok: true });
}
