const { resolveArticleUrl } = require("./preview");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url = "", title = "", source = "" } = req.body || {};
    const finalUrl = await resolveArticleUrl(url, title, source);
    return res.status(200).json({
      success: true,
      finalUrl: finalUrl.toString(),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message || "Gagal mengarahkan URL sumber",
    });
  }
};
