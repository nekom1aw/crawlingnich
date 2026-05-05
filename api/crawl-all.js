import axios from "axios";
import { parseString } from "xml2js";

function extractSource(link) {
  try {
    const url = new URL(link);
    let source = url.hostname.replace("www.", "").split(".")[0];
    return source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    return "Unknown";
  }
}

function formatDate(pubDate) {
  if (!pubDate) return "Tanggal tidak tersedia";
  try {
    return new Date(pubDate).toLocaleDateString("id-ID");
  } catch {
    return "Tanggal tidak tersedia";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      message: "Gunakan POST untuk endpoint ini"
    });
  }

  const { primaryKeywords, secondaryKeywords } = req.body;

  const results = [];

  for (const primary of primaryKeywords) {
    for (const secondary of secondaryKeywords) {
      const query = `${primary} ${secondary}`;

      try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;

        const response = await axios.get(url);

        const parsed = await new Promise((resolve, reject) => {
          parseString(response.data, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        const items = parsed?.rss?.channel?.[0]?.item || [];

        items.forEach(item => {
          results.push({
            title: item.title?.[0],
            link: item.link?.[0],
            date: formatDate(item.pubDate?.[0]),
            source: extractSource(item.link?.[0])
          });
        });

      } catch (err) {
        console.log(err.message);
      }
    }
  }

  return res.status(200).json({
    success: true,
    total: results.length,
    results
  });
}