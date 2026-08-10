'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';

const THEME_KEY = 'crawling-theme';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage can be unavailable in strict browser contexts.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function SunIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19a7 7 0 1 0-7-7" />
      <path d="M12 15a3 3 0 1 0-3-3" />
      <path d="M12 12 4.5 4.5" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <path d="M12 10.5h.01" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <path d="M16 5v4" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <path d="M8 15v4" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-5 7h3l-4 6h5v5" />
      <path d="m12 3 5 7h-3l4 6h-5v5" />
    </svg>
  );
}

const navItems = [
  { href: '/', label: 'Crawling', icon: <RadarIcon /> },
  { href: '/isu-daerah', label: 'Isu Daerah', icon: <MapPinIcon /> },
  { href: '/crawling-custom', label: 'Crawling Custom', icon: <SlidersIcon /> },
  { href: '/menu-kemenhut', label: 'Kemenhut', icon: <TreeIcon /> },
];

export default function AppNavbar() {
  const [theme, setTheme] = useState<Theme>('light');
  const [path, setPath] = useState('/');

  useEffect(() => {
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    setPath(window.location.pathname.replace(/\/+$/, '') || '/');
  }, []);

  const activePath = useMemo(() => path.replace(/\/+$/, '') || '/', [path]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Keep the toggle usable even when storage is blocked.
    }
  }

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (href === activePath) return;
    document.body.classList.add('is-page-leaving');
  }

  return (
    <nav className="app-nav">
      <div className="nav-left">
        <div className="nav-logo"><div className="logo-dot" />Crawling Beta test</div>
        <div className="nav-menu">
          {navItems.map((item) => (
            <a
              key={item.href}
              className={`nav-link${activePath === item.href || (item.href !== '/' && activePath.startsWith(`${item.href}/`)) ? ' active' : ''}`}
              href={item.href}
              onClick={(event) => handleNavClick(event, item.href)}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <div className="badge-live"><div className="dot-pulse" />ENGINE READY</div>
        <button
          className="theme-toggle"
          id="themeToggle"
          type="button"
          aria-label={theme === 'dark' ? 'Ubah ke mode light' : 'Ubah ke mode dark'}
          title={theme === 'dark' ? 'Mode light' : 'Mode dark'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}
