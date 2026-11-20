// Run against a live server:  COY_DB_FILE=/tmp/coy-test.json npm run dev   (then)   COY_DB_FILE=/tmp/coy-test.json npm run test:api
import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://localhost:3000';
const DB = process.env.COY_DB_FILE || 'data/db.json';
const j = async (path, init) => { const r = await fetch(BASE + path, init); return { status: r.status, body: await r.json() }; };
const swipe = (profileId, action) => j('/swipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, action }) });

await j('/api/reset', { method: 'POST' });
const feed = (await j('/feed')).body.profiles;
assert.ok(feed.length >= 30, 'at least 30 profiles');
for (const p of feed) assert.deepEqual(Object.keys(p).sort(), ['age', 'bio', 'id', 'interests', 'name', 'photo', 'place'], 'feed exposes only public fields');
assert.equal(JSON.stringify(feed).includes('likesMe'), false);

const db = JSON.parse(fs.readFileSync(DB, 'utf8')); // test-only peek at server-private data
const likers = db.profiles.filter((p) => p.likesMe), others = db.profiles.filter((p) => !p.likesMe);
assert.ok(likers.length >= 10, 'some profiles already like the user');

assert.equal((await swipe(likers[0].id, 'like')).body.match, true, 'like on a liker matches');
assert.equal((await swipe(others[0].id, 'like')).body.match, false, 'like on a non-liker does not match');
assert.equal((await swipe(likers[1].id, 'pass')).body.match, false, 'pass never matches');
assert.equal((await swipe(likers[0].id, 'like')).status, 409, 'cannot swipe twice');
assert.equal((await swipe('nope', 'like')).status, 404);
assert.equal((await swipe(others[1].id, 'maybe')).status, 400);

const after = (await j('/feed')).body.profiles.map((p) => p.id);
for (const id of [likers[0].id, others[0].id, likers[1].id]) assert.equal(after.includes(id), false, 'swiped profile never reappears');
assert.equal(after.length, feed.length - 3);

const matches = (await j('/matches')).body.matches;
assert.deepEqual(matches.map((m) => m.id), [likers[0].id], 'only mutual likes are matches (passed liker is not)');
console.log('All API checks passed.');
