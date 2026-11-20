
'use client';

import { useState } from 'react';
import Discover from './components/Discover.js';

export default function App() {
  const [tab, setTab] = useState('home');

  return (
    <div className="shell">
      <main className="screen">

        {/* HOME DASHBOARD */}
        <section
          hidden={tab !== 'home'}
          aria-label="Home"
          className="home-dashboard"
        >
          <div className="home-content">

            <p className="home-label">COY · DISCOVER</p>

            <h1>Welcome back! 👋</h1>

            <p className="home-subtitle">
              Your next connection could be one swipe away.
            </p>

            <div className="home-hero">
              <div className="hero-icon">💜</div>
              <h2>Find your connection</h2>
              <p>
                Meet new people, discover shared interests
                and create meaningful connections.
              </p>

              <button
                className="home-primary"
                onClick={() => setTab('discover')}
              >
                Start Discovering →
              </button>
            </div>

            <h2 className="home-heading">
              Explore your experience
            </h2>

            <div className="home-grid">

              <button
                className="home-card"
                onClick={() => setTab('discover')}
              >
                <span>❤️</span>
                <h3>Discover</h3>
                <p>Find interesting people.</p>
              </button>

              <button
                className="home-card"
                onClick={() => setTab('discover')}
              >
                <span>💬</span>
                <h3>Matches</h3>
                <p>Explore your connections.</p>
              </button>

            </div>

            <div className="home-footer">
              Made with 💜 for meaningful connections.
            </div>

          </div>
        </section>

        {/* DISCOVER */}
        <section
          hidden={tab !== 'discover'}
          aria-label="Discover"
          className="pane"
        >
          <Discover active={tab === 'discover'} />
        </section>

      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="tabbar" aria-label="Main">

        {['home', 'discover'].map((t) => (
          <button
            key={t}
            className="tab"
            aria-current={tab === t ? 'page' : undefined}
            onClick={() => setTab(t)}
          >
            {t === 'home' ? 'Home' : 'Discover'}
          </button>
        ))}

      </nav>
    </div>
  );
}
