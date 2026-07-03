import type { ReactNode } from 'react';
import AppFooter from './_components/AppFooter';
import AppNavbar from './_components/AppNavbar';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/src/header.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = localStorage.getItem('crawling-theme');
                  var theme = saved === 'dark' || saved === 'light'
                    ? saved
                    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.dataset.theme = theme;
                } catch (error) {
                  document.documentElement.dataset.theme = 'light';
                }
              })();
            `
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html {
                min-height: 100%;
                background:
                  radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(255,255,255,0) 34%),
                  radial-gradient(circle at 82% 16%, rgba(143,204,255,0.38), rgba(143,204,255,0) 25%),
                  radial-gradient(circle at 20% 86%, rgba(143,170,255,0.28), rgba(143,170,255,0) 32%),
                  linear-gradient(180deg, #f7fbff 0%, #e8f1ff 45%, #dfeaff 100%);
              }

              html[data-theme="dark"] {
                background:
                  radial-gradient(circle at top left, rgba(42,72,120,0.32), rgba(42,72,120,0) 34%),
                  radial-gradient(circle at 82% 16%, rgba(32,97,170,0.24), rgba(32,97,170,0) 28%),
                  radial-gradient(circle at 20% 86%, rgba(20,113,92,0.16), rgba(20,113,92,0) 32%),
                  linear-gradient(180deg, #10182a 0%, #0d1423 48%, #09111d 100%);
              }

              body {
                min-height: 100vh;
                margin: 0;
                background: transparent;
                transition: opacity 0.2s ease, filter 0.2s ease;
              }

              .app-layout {
                min-height: 100vh;
                display: grid;
                grid-template-rows: 64px minmax(0, 1fr) 34px;
              }

              .app-content {
                min-width: 0;
                min-height: 0;
              }

              @media (max-width: 720px) {
                .app-layout {
                  grid-template-rows: 58px minmax(0, 1fr) 34px;
                }
              }

              body.is-page-leaving {
                opacity: 0.86;
                filter: blur(1px);
                pointer-events: none;
              }

              @view-transition {
                navigation: auto;
              }

              ::view-transition-old(root),
              ::view-transition-new(root) {
                animation-duration: 0.28s;
                animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
              }

              ::view-transition-old(root) {
                animation-name: page-out;
              }

              ::view-transition-new(root) {
                animation-name: page-in;
              }

              @keyframes page-out {
                from {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                  filter: blur(0);
                }
                to {
                  opacity: 0;
                  transform: translateY(6px) scale(0.992);
                  filter: blur(4px);
                }
              }

              @keyframes page-in {
                from {
                  opacity: 0;
                  transform: translateY(8px) scale(0.992);
                  filter: blur(4px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                  filter: blur(0);
                }
              }

              @media (prefers-reduced-motion: reduce) {
                body {
                  transition: none;
                }

                ::view-transition-old(root),
                ::view-transition-new(root) {
                  animation-duration: 0.01ms;
                }
              }
            `
          }}
        />
      </head>
      <body>
        <div className="app-layout">
          <header id="appHeader">
            <AppNavbar />
          </header>
          <div className="app-content">{children}</div>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
