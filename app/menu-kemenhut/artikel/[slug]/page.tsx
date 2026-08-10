import Link from "next/link";
import { notFound } from "next/navigation";
import { getKemenhutArticle } from "../../../../lib/kemenhut/article";

export default async function ArticleSummaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getKemenhutArticle(slug);
  if (!article) notFound();

  return (
    <div className="kemenhut-page"><main className="detail-page">
      <Link className="back-link" href="/menu-kemenhut">← Kembali ke pencarian</Link>

      <article className="detail-card">
        <div className="detail-heading">
          <p className="eyebrow">RINGKASAN OTOMATIS · ARTIKEL KEMENHUT</p>
          <p className="detail-meta">{article.date} · {article.category}</p>
          <h1>{article.title}</h1>
        </div>

        {article.image && <img className="detail-image" src={article.image} alt="" />}

        <section className="conclusion">
          <span>Kesimpulan singkat</span>
          <p>{article.summary}</p>
        </section>

        <section className="key-points">
          <h2>5W + 1H</h2>
          <div className="five-grid">
            <div><span>Apa</span><p>{article.fiveWOneH.what}</p></div>
            <div><span>Siapa</span><p>{article.fiveWOneH.who}</p></div>
            <div><span>Kapan</span><p>{article.fiveWOneH.when}</p></div>
            <div><span>Di mana</span><p>{article.fiveWOneH.where}</p></div>
            <div><span>Mengapa</span><p>{article.fiveWOneH.why}</p></div>
            <div><span>Bagaimana</span><p>{article.fiveWOneH.how}</p></div>
          </div>
        </section>

        <div className="source-note">
          <p>Ringkasan dibuat otomatis dari naskah publik. Periksa sumber asli untuk keputusan atau kutipan resmi.</p>
          <a href={article.sourceUrl} rel="noreferrer" target="_blank">Buka artikel asli ↗</a>
        </div>
      </article>
    </main></div>
  );
}

