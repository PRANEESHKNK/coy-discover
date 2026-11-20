import fs from 'node:fs';
import path from 'node:path';
import { buildSeed } from './seed.js';

const FILE = process.env.COY_DB_FILE || path.join(process.cwd(), 'data', 'db.json');

export function load() {
  if (!fs.existsSync(FILE)) save(buildSeed());
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function save(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE); // atomic replace: a crash can't leave a half-written file
}

// Whitelist (not blacklist) so a new private field can never leak by accident.
export const toPublic = (p) => ({
  id: p.id, name: p.name, age: p.age, photo: p.photo, bio: p.bio, place: p.place, interests: p.interests,
});

export function getFeed() {
  const db = load();
  const seen = new Set(db.swipes.map((s) => s.profileId));
  const byId = new Map(db.profiles.map((p) => [p.id, p]));
  return db.order.filter((id) => !seen.has(id)).map((id) => toPublic(byId.get(id)));
}

export function recordSwipe(profileId, action) {
  const db = load();
  const profile = db.profiles.find((p) => p.id === profileId);
  if (!profile) return { status: 404, body: { error: 'Profile not found.' } };
  if (db.swipes.some((s) => s.profileId === profileId)) {
    return { status: 409, body: { error: 'You already swiped on this profile.' } };
  }
  const at = Date.now();
  db.swipes.push({ profileId, action, at });
  // Mutual only: the server alone knows `likesMe`; the client just learns match true/false.
  const match = action === 'like' && profile.likesMe === true;
  if (match) db.matches.push({ profileId, at });
  save(db);
  return { status: 200, body: match ? { match: true, profile: toPublic(profile) } : { match: false } };
}

export function getMatches() {
  const db = load();
  const byId = new Map(db.profiles.map((p) => [p.id, p]));
  return [...db.matches].sort((a, b) => b.at - a.at)
    .map((m) => ({ ...toPublic(byId.get(m.profileId)), matchedAt: m.at }));
}

export function resetDb() {
  save(buildSeed());
}
