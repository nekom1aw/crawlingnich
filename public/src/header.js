(function () {
  const THEME_KEY = 'crawling-theme';

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Browser storage can be unavailable in strict contexts.
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const button = document.getElementById('themeToggle');
    if (!button) return;

    const isDark = theme === 'dark';
    button.setAttribute('aria-label', isDark ? 'Ubah ke mode light' : 'Ubah ke mode dark');
    button.setAttribute('title', isDark ? 'Mode light' : 'Mode dark');
    button.innerHTML = isDark
      ? '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"></path><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>'
      : '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"></path></svg>';
  }

  setTheme(getInitialTheme());

  function mountHeader() {
    const target = document.getElementById('appHeader');
    if (!target) return;

    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const crawlingActive = path === '/';
    const regionalActive = path === '/isu-daerah';

    if (!target.querySelector('.app-nav')) {
      target.innerHTML = `
        <nav class="app-nav">
          <div class="nav-left">
            <div class="nav-logo"><div class="logo-dot"></div>Crawling Beta test</div>
            <div class="nav-menu">
              <a class="nav-link" data-nav="crawling" href="/"><i class="ti ti-radar"></i><span>Crawling</span></a>
              <a class="nav-link" data-nav="regional" href="/isu-daerah"><i class="ti ti-map-pin"></i><span>Isu Daerah</span></a>
            </div>
          </div>
          <div class="nav-right">
            <div class="badge-live"><div class="dot-pulse"></div>ENGINE READY</div>
            <button class="theme-toggle" id="themeToggle" type="button" aria-label="Ubah mode tampilan"></button>
          </div>
        </nav>
      `;
    }

    target.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));
    target.querySelector('a[href="/"]')?.classList.toggle('active', crawlingActive);
    target.querySelector('a[href="/isu-daerah"]')?.classList.toggle('active', regionalActive);

    setTheme(document.documentElement.dataset.theme || getInitialTheme());
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle && themeToggle.dataset.bound !== 'true') {
      themeToggle.dataset.bound = 'true';
      themeToggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(THEME_KEY, nextTheme);
        } catch {
          // Keep the toggle usable even when storage is blocked.
        }
        setTheme(nextTheme);
      });
    }

    target.querySelectorAll('a.nav-link[href^="/"]').forEach((link) => {
      if (link.dataset.smoothNav === 'true') return;
      link.dataset.smoothNav = 'true';
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

        document.body.classList.add('is-page-leaving');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHeader);
  } else {
    mountHeader();
  }
})();
