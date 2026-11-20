// Deterministic mock data. `likesMe` is SERVER-ONLY and never leaves lib/db.js.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['Aanya','Rohan','Meera','Kabir','Isha','Arjun','Naina','Vihaan','Tara','Dev','Anika','Reyansh','Saanvi','Ishaan','Diya','Aarav','Kiara','Neil','Riya','Aditya','Zoya','Karan','Myra','Samar','Pari','Yash','Sana','Veer','Avni','Rahul','Ira','Kunal','Mahi','Nikhil','Tanya','Om'];
const PLACES = ['Bengaluru','Hyderabad','Pune','Mumbai','Delhi','Chennai','Kolkata','Vijayawada','Jaipur','Ahmedabad','Kochi','Chandigarh'];
const INTERESTS = ['Indie music','Trekking','Chai','Photography','Stand-up comedy','Football','Badminton','Cooking','Anime','Sci-fi books','Chess','Dancing','Street food','Cycling','Film photography','Podcasts','Painting','Gaming','Yoga','Travel','Poetry','Coding'];
const BIOS = [
  'Will rate your playlist honestly.',
  'Weekend trekker, weekday napper.',
  'Looking for someone to split dessert with.',
  'Probably at a chai stall right now.',
  'Fluent in movie quotes and bad puns.',
  'Ask me about my sourdough starter.',
  'Cricket on TV, football in real life.',
  'Collects postcards and unfinished books.',
  'Quiet in person, loud in group chats.',
  'Will always pick the window seat.',
  'Coffee first, conversation second.',
  'Learning guitar. Neighbours are patient.',
  'Big on long walks and longer playlists.',
  'Can beat you at chess. Maybe.',
  'Always up for a spontaneous road trip.',
  'Here for good food and better jokes.',
];

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSeed() {
  const rng = mulberry32(2026);
  const profiles = NAMES.map((name, i) => ({
    id: `p${1000 + Math.floor(rng() * 9000)}${i}`, // opaque ids: no pattern reveals likers
    name,
    age: 19 + Math.floor(rng() * 9),
    photo: `https://picsum.photos/seed/coy-${i + 1}/600/800`,
    bio: BIOS[Math.floor(rng() * BIOS.length)],
    place: PLACES[Math.floor(rng() * PLACES.length)],
    interests: shuffle(INTERESTS, rng).slice(0, 3 + Math.floor(rng() * 2)),
    likesMe: false,
  }));
  // 12 randomly chosen profiles have already liked the logged-in user.
  shuffle(profiles.map((_, i) => i), rng).slice(0, 12).forEach((i) => (profiles[i].likesMe = true));
  // Feed order is shuffled so position never hints at who liked you.
  const order = shuffle(profiles.map((p) => p.id), rng);
  return { profiles, order, swipes: [], matches: [] };
}
