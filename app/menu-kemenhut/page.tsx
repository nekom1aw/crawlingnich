"use client";

import "./kemenhut.css";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { SearchResponse } from "../../lib/kemenhut/kemenhut";
import type { PbphhResponse } from "../../lib/kemenhut/silk";
import { buildRpbbiReportUrl, rpbbiSourcePages, type RpbbiDataResponse, type RpbbiProduction, type RpbbiReport, type RpbbiScale, type RpbbiScope, type RpbbiStatus } from "../../lib/kemenhut/rpbbi";

const reportMeta = {
  pemenuhan: { number: "01", title: "Pemenuhan Bahan Baku", description: "Asal dan volume bahan baku" },
  penggunaan: { number: "02", title: "Penggunaan Bahan Baku", description: "Pemakaian dan hasil produksi" },
  utilitas: { number: "03", title: "Utilitas Tahunan", description: "Kapasitas dan tingkat utilitas" },
} as const;

type MainMenu = "berita-kemenhut" | "berita-lingkungan" | "rpbbi" | "pbphh";

export default function Home() {
  const [activeMenu, setActiveMenu] = useState<MainMenu>("berita-kemenhut");
  const [keyword, setKeyword] = useState("gajah");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("");
  const [pbphh, setPbphh] = useState<PbphhResponse | null>(null);
  const [pbphhError, setPbphhError] = useState("");
  const [pbphhLoading, setPbphhLoading] = useState(false);
  const [rpbbiReport, setRpbbiReport] = useState<RpbbiReport>("pemenuhan");
  const [rpbbiYear, setRpbbiYear] = useState(2026);
  const [rpbbiStatus, setRpbbiStatus] = useState<RpbbiStatus>("Rencana");
  const [rpbbiScale, setRpbbiScale] = useState<RpbbiScale>("over");
  const [rpbbiProduction, setRpbbiProduction] = useState<RpbbiProduction>("Primer");
  const [rpbbiScope, setRpbbiScope] = useState<RpbbiScope>("national");
  const [rpbbiData, setRpbbiData] = useState<RpbbiDataResponse | null>(null);
  const [rpbbiLoading, setRpbbiLoading] = useState(false);
  const [rpbbiError, setRpbbiError] = useState("");

  useEffect(() => {
    void loadPbphh(1, "");
  }, []);

  useEffect(() => {
    setRpbbiData(null);
    setRpbbiError("");
  }, [rpbbiReport, rpbbiYear, rpbbiStatus, rpbbiScale, rpbbiProduction, rpbbiScope]);

  async function search(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setData(null);

    try {
      const source = activeMenu === "berita-lingkungan" ? "kemenlh" : "kemenhut";
      const response = await fetch(`/api/menu-kemenhut/search?keyword=${encodeURIComponent(keyword)}&limit=10&maxPages=10&source=${source}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Pencarian gagal");
      setData(json);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pencarian gagal");
    } finally {
      setLoading(false);
    }
  }

  async function loadPbphh(page: number, companyName = company) {
    setPbphhLoading(true);
    setPbphhError("");
    try {
      const response = await fetch(`/api/menu-kemenhut/pbphh?company=${encodeURIComponent(companyName)}&page=${page}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Pencarian PBPHH gagal");
      setPbphh(json);
    } catch (reason) {
      setPbphhError(reason instanceof Error ? reason.message : "Pencarian PBPHH gagal");
    } finally {
      setPbphhLoading(false);
    }
  }

  async function searchCompany(event: FormEvent) {
    event.preventDefault();
    await loadPbphh(1);
  }

  function showAllPbphh() {
    setCompany("");
    void loadPbphh(1, "");
  }

  function selectMenu(menu: MainMenu) {
    setActiveMenu(menu);
    setData(null);
    setError("");
    if (menu === "berita-kemenhut") setKeyword("gajah");
    if (menu === "berita-lingkungan") setKeyword("lingkungan");
  }

  const rpbbiUrl = buildRpbbiReportUrl({
    report: rpbbiReport,
    year: rpbbiYear,
    status: rpbbiStatus,
    scale: rpbbiScale,
    production: rpbbiProduction,
    scope: rpbbiScope,
  });
  const rpbbiCategory = rpbbiReport === "utilitas"
    ? (rpbbiScope === "national" ? "Nasional" : "Per provinsi")
    : `${rpbbiScale === "over" ? "> 6.000" : "≤ 6.000"}${rpbbiReport === "penggunaan" ? ` · ${rpbbiProduction}` : ""}`;

  async function loadRpbbiData() {
    setRpbbiLoading(true);
    setRpbbiError("");
    setRpbbiData(null);
    const query = new URLSearchParams({
      report: rpbbiReport,
      year: String(rpbbiYear),
      status: rpbbiStatus,
      scale: rpbbiScale,
      production: rpbbiProduction,
      scope: rpbbiScope,
    });
    try {
      const response = await fetch(`/api/menu-kemenhut/rpbbi?${query}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Gagal mengambil data RPBBI");
      setRpbbiData(json);
    } catch (reason) {
      setRpbbiError(reason instanceof Error ? reason.message : "Gagal mengambil data RPBBI");
    } finally {
      setRpbbiLoading(false);
    }
  }

  return (
    <div className="kemenhut-page"><main>
      <nav aria-label="Menu utama" className="main-menu">
        <button className={activeMenu === "berita-kemenhut" ? "active" : ""} onClick={() => selectMenu("berita-kemenhut")} type="button"><span>Berita</span><strong>Kehutanan</strong></button>
        <button className={activeMenu === "berita-lingkungan" ? "active" : ""} onClick={() => selectMenu("berita-lingkungan")} type="button"><span>Berita</span><strong>Lingkungan</strong></button>
        <button className={activeMenu === "rpbbi" ? "active" : ""} onClick={() => selectMenu("rpbbi")} type="button"><span>Data publik</span><strong>RPBBI</strong></button>
        <button className={activeMenu === "pbphh" ? "active" : ""} onClick={() => selectMenu("pbphh")} type="button"><span>Data publik</span><strong>PBPHH</strong></button>
      </nav>

      {(activeMenu === "berita-kemenhut" || activeMenu === "berita-lingkungan") && (
        <section className="news-search-section">
          <p className="eyebrow">{activeMenu === "berita-kemenhut" ? "KEMENTERIAN KEHUTANAN" : "KEMENTERIAN LINGKUNGAN HIDUP"}</p>
          <h2 className="section-title">Cari berita {activeMenu === "berita-kemenhut" ? "kehutanan" : "lingkungan"}</h2>
          <p className="lead">Masukkan kata kunci untuk mencari berita dari situs resmi kementerian.</p>
          <form onSubmit={search}>
            <input aria-label="Kata kunci" minLength={2} onChange={(event) => setKeyword(event.target.value)} placeholder={activeMenu === "berita-kemenhut" ? "Contoh: gajah" : "Contoh: pencemaran"} required value={keyword} />
            <button disabled={loading} type="submit">{loading ? "Mencari…" : "Cari berita"}</button>
          </form>
          {error && <p className="error">{error}</p>}

          {data && <div className="results">
          <div className="summary">
            <strong>{data.total} hasil</strong>
            <span>{data.pagesScanned} halaman diperiksa · {activeMenu === "berita-kemenhut" ? "Kemenhut" : "KemenLH"}</span>
          </div>

          {data.results.length === 0 ? (
            <div className="empty">Belum ditemukan. Naikkan <code>maxPages</code> melalui API untuk pencarian lebih dalam.</div>
          ) : (
            <div className="grid">
              {data.results.map((item) => (
                <article key={item.url}>
                  <p>{item.date ?? "Tanggal tidak tersedia"}{item.category ? ` · ${item.category}` : ""}</p>
                  <h2>{item.title}</h2>
                  {item.sourceType === "kemenhut"
                    ? <Link href={`/menu-kemenhut/artikel/${item.url.split("/").pop()}`}>Baca ringkasan →</Link>
                    : <a href={item.url} rel="noreferrer" target="_blank">Baca di KemenLH ↗</a>}
                </article>
              ))}
            </div>
          )}
          </div>}
        </section>
      )}

      {activeMenu === "rpbbi" && <section className="rpbbi-section menu-content">
        <p className="eyebrow">DATA PUBLIK RPBBI</p>
        <h2 className="section-title">Laporan bahan baku dan utilitas</h2>
        <p className="lead">Pilih jenis laporan, tahun, dan kategori. Tombol akan membuka laporan resmi RPBBI tanpa login.</p>

        <div aria-label="Jenis data RPBBI" className="report-tabs">
          {(Object.keys(reportMeta) as RpbbiReport[]).map((report) => (
            <button className={rpbbiReport === report ? "active" : ""} key={report} onClick={() => setRpbbiReport(report)} type="button">
              <span className="report-number">{reportMeta[report].number}</span>
              <span className="report-tab-copy"><strong>{reportMeta[report].title}</strong><small>{reportMeta[report].description}</small></span>
              <span className="report-check">✓</span>
            </button>
          ))}
        </div>

        <div className="report-control-panel">
          <div className="control-heading"><div><span>FILTER LAPORAN</span><strong>Atur data yang ingin ditampilkan</strong></div><small>Data diambil langsung dari RPBBI</small></div>
          <div className="report-picker">
            <label><span>Tahun laporan</span>
              <select value={rpbbiYear} onChange={(event) => setRpbbiYear(Number(event.target.value))}>
                {Array.from({ length: 12 }, (_, index) => 2026 - index).map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label><span>Status data</span>
              <select value={rpbbiStatus} onChange={(event) => setRpbbiStatus(event.target.value as RpbbiStatus)}>
                <option value="Rencana">Rencana</option>
                <option value="Realisasi">Realisasi</option>
              </select>
            </label>
            {rpbbiReport !== "utilitas" && <label><span>Skala industri</span>
              <select value={rpbbiScale} onChange={(event) => setRpbbiScale(event.target.value as RpbbiScale)}>
                <option value="over">Lebih dari 6.000</option>
                <option value="under">Sampai dengan 6.000</option>
              </select>
            </label>}
            {rpbbiReport === "penggunaan" && <label><span>Jenis produksi</span>
              <select value={rpbbiProduction} onChange={(event) => setRpbbiProduction(event.target.value as RpbbiProduction)}>
                <option value="Primer">Primer</option>
                <option value="Sekunder">Sekunder</option>
              </select>
            </label>}
            {rpbbiReport === "utilitas" && <label><span>Cakupan laporan</span>
              <select value={rpbbiScope} onChange={(event) => setRpbbiScope(event.target.value as RpbbiScope)}>
                <option value="national">Nasional</option>
                <option value="province">Per provinsi</option>
              </select>
            </label>}
          </div>

          <div className="report-actions">
            <button disabled={rpbbiLoading} onClick={() => void loadRpbbiData()} type="button"><span>{rpbbiLoading ? "Mengambil data…" : "Tampilkan data"}</span><b>→</b></button>
            <a className="report-link-secondary" href={rpbbiUrl} rel="noreferrer" target="_blank">Laporan asli ↗</a>
            <a href={rpbbiSourcePages[rpbbiReport]} rel="noreferrer" target="_blank">Halaman sumber</a>
          </div>
        </div>
        {rpbbiError && <p className="error">{rpbbiError}</p>}
        {rpbbiData && (
          <div className="rpbbi-results">
            <div className="data-overview">
              <div className="overview-title"><span>HASIL LAPORAN</span><h3>{reportMeta[rpbbiReport].title}</h3><p>{rpbbiData.title}</p></div>
              <div className="overview-metric"><span>Baris data</span><strong>{rpbbiData.totalRows}</strong></div>
              <div className="overview-metric"><span>Tahun</span><strong>{rpbbiYear}</strong></div>
              <div className="overview-metric"><span>Status</span><strong>{rpbbiStatus}</strong></div>
              <div className="overview-metric"><span>Kategori</span><strong>{rpbbiCategory}</strong></div>
            </div>
            {rpbbiData.rows.length === 0 ? <div className="empty">Untuk pilihan ini, sumber RPBBI menyatakan data belum tersedia.</div> : (
              <div className="rpbbi-table-shell">
                <div className="table-toolbar">
                  <div><strong>Data per wilayah</strong><span>Angka mengikuti satuan pada kepala kolom</span></div>
                  <span className="scroll-hint">Geser tabel ke kanan →</span>
                </div>
                <div className="rpbbi-table">
                  <table>
                    <thead><tr>{rpbbiData.headers.map((header, index) => {
                      const parts = header.split(" · ");
                      return <th key={`${header}-${index}`}>
                        {parts.length > 1 && <small>{parts[0]}</small>}
                        <strong>{parts.length > 1 ? parts[1] : parts[0]}</strong>
                        {parts.length > 2 && <em>{parts.slice(2).join(" · ")}</em>}
                      </th>;
                    })}</tr></thead>
                    <tbody>{rpbbiData.rows.map((row, rowIndex) => (
                      <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => (
                        <td className={/^-?[\d.,]+(?:\s*%)?$/.test(cell) ? "numeric-cell" : ""} key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                      ))}</tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>}

      {activeMenu === "pbphh" && <section className="pbphh-section menu-content">
        <p className="eyebrow">DATA PUBLIK SILK</p>
        <h2 className="section-title">Data PBPHH</h2>
        <p className="lead">Daftar pemegang S-Legalitas ditampilkan otomatis. Ketik nama perusahaan untuk menyaring data.</p>
        <form onSubmit={searchCompany}>
          <input
            aria-label="Nama perusahaan PBPHH"
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Contoh: Kutai Timber Indonesia"
            value={company}
          />
          <button disabled={pbphhLoading} type="submit">{pbphhLoading ? "Mencari…" : "Cari PBPHH"}</button>
          {company && <button className="button-secondary" disabled={pbphhLoading} onClick={showAllPbphh} type="button">Tampilkan semua</button>}
        </form>

        {pbphhError && <p className="error">{pbphhError}</p>}
        {pbphhLoading && !pbphh && <div className="empty">Memuat daftar PBPHH dari SILK…</div>}
        {pbphh && (
          <div className="pbphh-results">
            <div className="summary">
              <strong>{pbphh.total.toLocaleString("id-ID")} data</strong>
              <span>Halaman {pbphh.page} dari {pbphh.totalPages} · SILK Kemenhut</span>
            </div>
            {pbphh.results.length === 0 ? <div className="empty">Nama perusahaan tidak ditemukan pada daftar pemegang S-Legalitas.</div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Perusahaan</th><th>Wilayah</th><th>Sertifikat</th><th>Masa berlaku</th></tr></thead>
                  <tbody>{pbphh.results.map((item) => (
                    <tr key={`${item.company}-${item.certificateNumber}`}>
                      <td><strong>{item.company}</strong><small>{item.address}</small></td>
                      <td>{item.city}<small>{item.province}</small></td>
                      <td>{item.certificateNumber}<small>{item.certificateType} · {item.certificationBody}</small></td>
                      <td>{item.validityPeriod}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {pbphh.totalPages > 1 && (
              <nav aria-label="Navigasi halaman PBPHH" className="pagination">
                <button
                  className="button-secondary"
                  disabled={pbphhLoading || pbphh.page <= 1}
                  onClick={() => void loadPbphh(pbphh.page - 1)}
                  type="button"
                >
                  ← Sebelumnya
                </button>
                <span>Halaman <strong>{pbphh.page}</strong> / {pbphh.totalPages}</span>
                <button
                  disabled={pbphhLoading || pbphh.page >= pbphh.totalPages}
                  onClick={() => void loadPbphh(pbphh.page + 1)}
                  type="button"
                >
                  Berikutnya →
                </button>
              </nav>
            )}
          </div>
        )}
      </section>}
    </main></div>
  );
}

