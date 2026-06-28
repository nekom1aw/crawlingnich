'use client';

import { useEffect } from 'react';

type LegacyPageProps = {
  title: string;
  fontsHref: string;
  extraStylesheets?: string[];
  styleText: string;
  bodyHtml: string;
  scriptText: string;
  beforeScriptSrc?: string[];
};

export default function LegacyPage({
  title,
  fontsHref,
  extraStylesheets = [],
  styleText,
  bodyHtml,
  scriptText,
  beforeScriptSrc = []
}: LegacyPageProps) {
  const scriptId = `legacy-script-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  useEffect(() => {
    let cancelled = false;
    const loadedScripts: HTMLScriptElement[] = [];

    function loadScript(src: string) {
      return new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing?.dataset.loaded === 'true') {
          resolve();
          return;
        }

        const script = existing || document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => {
          script.dataset.loaded = 'true';
          resolve();
        };
        script.onerror = () => reject(new Error(`Gagal memuat script ${src}`));

        if (!existing) {
          document.body.appendChild(script);
          loadedScripts.push(script);
        }
      });
    }

    async function runLegacyScripts() {
      await loadScript('/src/header.js');
      for (const src of beforeScriptSrc) {
        await loadScript(src);
      }
      if (cancelled) return;

      document.getElementById(scriptId)?.remove();
      const script = document.createElement('script');
      script.id = scriptId;
      const scopedScript = scriptText.replace(
        'function goPage(p) { currentPage = p; renderResults(); }',
        'window.goPage = function goPage(p) { currentPage = p; renderResults(); }'
      );
      script.textContent = `(function(){\n${scopedScript}\n})();`;
      document.body.appendChild(script);
      loadedScripts.push(script);
    }

    runLegacyScripts().catch((error) => {
      console.error(error);
    });

    return () => {
      cancelled = true;
      delete (window as typeof window & { goPage?: unknown }).goPage;
      document.getElementById(scriptId)?.remove();
      for (const script of loadedScripts) {
        if (script.id === scriptId) script.remove();
      }
    };
  }, [beforeScriptSrc, scriptId, scriptText]);

  return (
    <>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={fontsHref} rel="stylesheet" precedence="default" />
      {extraStylesheets.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      <link rel="stylesheet" href="/src/header.css" precedence="default" />
      <style
        href={`legacy-style-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        precedence="default"
        dangerouslySetInnerHTML={{ __html: styleText }}
      />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
