import type { ReactNode } from 'react';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
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
                transition: opacity 0.16s ease;
              }

              body.is-page-leaving {
                opacity: 0.72;
              }
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
