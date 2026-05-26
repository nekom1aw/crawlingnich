import axios from "axios";
import { parseString } from "xml2js";

function extractSource(link) {
  try {
    const url = new URL(link);

    let source = url.hostname
      .replace("www.", "")
      .split(".")[0];

    return source.charAt(0).toUpperCase() + source.slice(1);

  } catch {
    return "Unknown";
  }
}

function formatDate(pubDate) {
  if (!pubDate) {
    return "Tanggal tidak tersedia";
  }

  const date = new Date(pubDate);

  if (isNaN(date.getTime())) {
    return "Tanggal tidak valid";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function handler(req, res) {

  // GET
  if (req.method === "GET") {
    return res.status(200).json({
      message: "API crawl-all aktif (gunakan POST)"
    });
  }

  // selain POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      primaryKeywords = [],
      secondaryKeywords = []
    } = req.body;

    const results = [];
    const seen = new Set();

    for (const primary of primaryKeywords) {

      for (const secondary of secondaryKeywords) {

        const query = `${primary} ${secondary}`;

        // =========================
        // NEWS
        // =========================
        try {

          const url =
            `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;

          const response = await axios.get(url);

          const parsed = await new Promise((resolve, reject) => {

            parseString(response.data, (err, result) => {

              if (err) {
                reject(err);
              } else {
                resolve(result);
              }

            });

          });

          const items =
            parsed?.rss?.channel?.[0]?.item || [];

          items.forEach((item) => {

            const link = item.link?.[0];

            if (!link || seen.has(link)) {
              return;
            }

            seen.add(link);

            results.push({
              type: "news",
              title: item.title?.[0] || "Tanpa Judul",
              link: link,
              date: formatDate(item.pubDate?.[0]),
              source: extractSource(link)
            });

          });

        } catch (err) {

          console.log("News error:", err.message);

        }

        // =========================
        // JOURNAL
        // =========================
        try {

          const response = await axios.get(
            "https://api.openalex.org/works",
            {
              params: {
                search: query,
                per_page: 5
              }
            }
          );

          response.data.results.forEach((p) => {

            const link =
              p.primary_location?.landing_page_url || "";

            if (!link || seen.has(link)) {
              return;
            }

            seen.add(link);

            results.push({
              type: "journal",
              title: p.title || "Tanpa Judul",
              link: link,
              date: p.publication_year || "-",
              source: "Journal"
            });

          });

        } catch (err) {

          console.log("Journal error:", err.message);

        }

      }

    }

    return res.status(200).json({
      success: true,
      total: results.length,
      results
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });

  }
}