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
    button.innerHTML = `<i class="ti ${isDark ? 'ti-sun' : 'ti-moon'}"></i>`;
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
    if (themeToggle?.dataset.bound === 'true') return;
    if (themeToggle) themeToggle.dataset.bound = 'true';
    themeToggle?.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch {
        // Keep the toggle usable even when storage is blocked.
      }
      setTheme(nextTheme);
    });

    target.querySelectorAll('a.nav-link[href^="/"]').forEach((link) => {
      if (link.dataset.smoothNav === 'true') return;
      link.dataset.smoothNav = 'true';
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

        event.preventDefault();
        document.body.classList.add('is-page-leaving');
        window.setTimeout(() => {
          window.location.href = url.pathname + url.search + url.hash;
        }, 120);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHeader);
  } else {
    mountHeader();
  }
})();
