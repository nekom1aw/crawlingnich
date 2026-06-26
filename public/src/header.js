(function () {
  function mountHeader() {
    const target = document.getElementById('appHeader');
    if (!target) return;

    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const crawlingActive = path === '/';
    const regionalActive = path === '/isu-daerah';

    target.innerHTML = `
      <nav class="app-nav">
        <div class="nav-left">
          <div class="nav-logo"><div class="logo-dot"></div>Crawling Beta test</div>
          <div class="nav-menu">
            <a class="nav-link ${crawlingActive ? 'active' : ''}" href="/"><i class="ti ti-radar"></i><span>Crawling</span></a>
            <a class="nav-link ${regionalActive ? 'active' : ''}" href="/isu-daerah"><i class="ti ti-map-pin"></i><span>Isu Daerah</span></a>
          </div>
        </div>
        <div class="nav-right">
          <div class="badge-live"><div class="dot-pulse"></div>ENGINE READY</div>
          <i class="ti ti-settings nav-icon"></i>
        </div>
      </nav>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHeader);
  } else {
    mountHeader();
  }
})();
