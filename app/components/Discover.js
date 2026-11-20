'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const THRESHOLD = 110; // px of horizontal drag that commits a swipe
const FLY_MS = 280;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

async function api(path, init) {
  const res = await fetch(path, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json' } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Fallback colour if a placeholder photo fails to load (e.g. offline).
function tint(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 38% 32%)`;
}

function Photo({ p }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="photo" style={{ background: tint(p.id) }}>
      <span className="initial" aria-hidden="true">{p.name[0]}</span>
      {!failed && <img src={p.photo} alt={`${p.name}'s photo`} draggable={false} onError={() => setFailed(true)} />}
    </div>
  );
}

export default function Discover({ active = true }) {
  const [view, setView] = useState('swipe');
  const [queue, setQueue] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState('');
  const [superPulse, setSuperPulse] = useState(false);
  const [matches, setMatches] = useState(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' | null
  const [matched, setMatched] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const busy = useRef(false);
  const startPt = useRef(null);
  const dragX = useRef(0);

  const loadFeed = useCallback(async () => {
    setLoadError(false);
    const r = await api('/api/feed').catch(() => null);
    if (!r || !r.ok) return setLoadError(true);
    setQueue(r.data.profiles);
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    if (view !== 'matches' || !active) return;
    api('/api/matches').then((r) => r.ok && setMatches(r.data.matches)).catch(() => setNotice("Couldn't load matches."));
  }, [view, active]);

  const settle = () => { setLeaving(null); setDrag({ x: 0, y: 0, active: false }); };

  
const commit = useCallback(async (dir) => {
  if (busy.current || !queue?.length) return;

  busy.current = true;
  setNotice('');

  const profile = queue[0];
  setLeaving(dir === 'left' ? 'left' : 'right');

  const [r] = await Promise.all([
    api('/api/swipe', {
      method: 'POST',
        body: JSON.stringify({
          profileId: profile.id,
          action: dir === 'left' ? 'pass' : 'like'
        })
      }).catch(() => null),
      sleep(FLY_MS),
    ]);

    if (!r || (!r.ok && r.status !== 409)) {
      settle();
      setNotice("Couldn't save that swipe. Try again.");
    } else {
      setQueue((q) => q.slice(1));
      settle();

      if (dir === 'super') {
        setNotice('⭐ Super Like sent to ' + profile.name + '!');
      }

      if (r.ok && r.data.match) {
        setMatched(r.data.profile);
      }
    }

    busy.current = false;
  }, [queue]);


  useEffect(() => {
    if (!active || view !== 'swipe' || matched) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') commit('right');
      if (e.key === 'ArrowLeft') commit('left');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, view, matched, commit]);

  const onDown = (e) => {
    if (busy.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startPt.current = { x: e.clientX, y: e.clientY };
    dragX.current = 0;
    setDrag({ x: 0, y: 0, active: true });
  };
  const onMove = (e) => {
    if (!startPt.current) return;
    dragX.current = e.clientX - startPt.current.x;
    setDrag({ x: dragX.current, y: (e.clientY - startPt.current.y) * 0.25, active: true });
  };
  const onUp = () => {
    if (!startPt.current) return;
    startPt.current = null;
    if (Math.abs(dragX.current) > THRESHOLD) commit(dragX.current > 0 ? 'right' : 'left');
    else setDrag({ x: 0, y: 0, active: false });
  };

  const resetDemo = async () => {
    await api('/api/reset', { method: 'POST' });
    setQueue(null); setMatches(null);
    loadFeed();
  };
  const top = queue?.[0];
  const x = leaving ? (leaving === 'right' ? 1 : -1) * 520 : drag.x;
  const topStyle = {
    transform: `translate3d(${x}px, ${leaving ? 0 : drag.y}px, 0) rotate(${x / 18}deg)`,
    transition: drag.active ? 'none' : `transform ${FLY_MS}ms cubic-bezier(.2,.8,.2,1)`,
  };

  return (
    <div className="discover">
      <header className="seg" role="group" aria-label="Discover sections">
        <button aria-pressed={view === 'swipe'} onClick={() => setView('swipe')}>Swipe</button>
        <button aria-pressed={view === 'matches'} onClick={() => setView('matches')}>Matches</button>
      </header>

      {notice && <p className="notice" role="status">{notice}</p>}

      {view === 'swipe' && (
        <>
          <div className="stage">
            {loadError ? (
              <div className="empty">
                <h2>Couldn’t load profiles</h2>
                <p>Check your connection, then try again.</p>
                <button className="primary" onClick={loadFeed}>Try again</button>
              </div>
            ) : queue === null ? (
              <p className="empty muted" role="status">Loading profiles…</p>
            ) : !top ? (
              <div className="empty">
                <h2>You’ve seen everyone for now</h2>
                <p>New people show up here as they join. Check back soon.</p>
                <button className="primary" onClick={loadFeed}>Check for new profiles</button>
                <button className="link" onClick={resetDemo}>Reset demo data</button>
              </div>
            ) : (
              queue.slice(0, 2).reverse().map((p) => {
                const isTop = p.id === top.id;
                return (
                  <article
                    key={p.id}
                    className={`card ${isTop ? 'top' : 'behind'}`}
                    style={isTop ? topStyle : undefined}
                    aria-label={`${p.name}, ${p.age}`}
                    aria-hidden={!isTop}
                    {...(isTop ? { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp } : {})}
                  >
                    <Photo p={p} />
                    {isTop && <span className="stamp like" style={{ opacity: leaving === 'right' ? 1 : clamp01(x / THRESHOLD) }}>Like</span>}
                    {isTop && <span className="stamp pass" style={{ opacity: leaving === 'left' ? 1 : clamp01(-x / THRESHOLD) }}>Pass</span>}
                    <div className="info">
                      <button
                        className="profile-details-btn"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfile(p);
                        }}
                      >
                        View Profile ↗
                      </button>
                      <h2>{p.name}, {p.age}</h2>
                      <p className="place">{p.place}</p>
                      <p className="bio">{p.bio}</p>
                      <ul className="chips">{p.interests.map((i) => <li key={i}>{i}</li>)}</ul>
                    </div>
                  </article>
                );
              })
            )}
          </div>
          <div className="actions">
            <button className="round pass" aria-label="Pass" disabled={!top} onClick={() => commit('left')}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <button className="round like" aria-label="Like" disabled={!top} onClick={() => commit('right')}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.6 2.7 5 6.2 5c2 0 3.2 1 3.8 2 .6-1 1.8-2 3.8-2 3.5 0 5.3 3.600 3.800 6.900C19.500 16.400 12 21 12 21z" /></svg>
            </button>

            <button
              className="round super"
              aria-label="Super Like"
              title="Super Like"
              disabled={!top}
              onClick={() => commit('super')}
              style={{
                background: '#302044',
                color: '#B99AFF',
                border: '1px solid #8B5CF6'
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="27"
                height="27"
                fill="currentColor"
              >
                <path d="M12 2L14.9 8.2L22 9.2L17 14.1L18.2 21L12 17.7L5.8 21L7 14.1L2 9.2L9.1 8.2Z"/>
              </svg>
            </button>

          </div>
        </>
      )}

      {view === 'matches' && (
        <div className="matches">
          {matches === null ? (
            <p className="empty muted" role="status">Loading matches…</p>
          ) : matches.length === 0 ? (
            <div className="empty">
              <h2>No matches yet</h2>
              <p>A match appears only when you both like each other.</p>
              <button className="primary" onClick={() => setView('swipe')}>Back to swiping</button>
            </div>
          ) : (
            <ul>
              {matches.map((m) => (
                <li key={m.id}>
                  <div className="avatar"><Photo p={m} /></div>
                  <div>
                    <h3>{m.name}, {m.age}</h3>
                    <p className="muted">{m.place} · matched {new Date(m.matchedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {matched && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="match-title">
          <div className="match-box">
            <div className="match-photo"><Photo p={matched} /></div>
            <h2 id="match-title">It’s a match!</h2>
            <p>You and {matched.name} liked each other.</p>
            <button className="primary" onClick={() => { setMatched(null); setView('matches'); }}>See matches</button>
            <button className="link" onClick={() => setMatched(null)}>Keep swiping</button>
          </div>
        </div>
      )}

      {selectedProfile && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="match-box profile-modal">
            <button
              className="link"
              onClick={() => setSelectedProfile(null)}
            >
              ✕ Close
            </button>

            <div className="match-photo">
              <Photo p={selectedProfile} />
            </div>

            <h2>
              {selectedProfile.name}, {selectedProfile.age}
            </h2>

            <p>📍 {selectedProfile.place}</p>

            <p>{selectedProfile.bio}</p>

            <h3>Interests</h3>

            <ul className="chips">
              {selectedProfile.interests.map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>

            <button
              className="primary"
              onClick={() => {
                setSelectedProfile(null);
                commit('right');
              }}
            >
              💚 Like Profile
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
