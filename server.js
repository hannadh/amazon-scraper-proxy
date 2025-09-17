const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/product/:asin", async (req, res) => {
  try {
    const asin = req.params.asin;
    const url = `https://www.amazon.com/dp/${asin}`;
    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      timeout: 10000,
    });
    const $ = cheerio.load(resp.data);

    const title = $("#productTitle").text().trim() || null;
    const image =
      $("#imgTagWrapperId img").attr("data-old-hires") ||
      $("#imgTagWrapperId img").attr("src") ||
      $("img#landingImage").attr("src") ||
      null;

    let bsr = null;
    $("#detailBullets_feature_div li, #productDetails_detailBullets_sections1 tr").each((i, el) => {
      const text = $(el).text();
      if (text && text.toLowerCase().includes("best sellers rank")) {
        bsr = text.replace(/\s+/g, " ").trim();
      }
    });

    const price =
      $("#priceblock_ourprice, #priceblock_dealprice").first().text().trim() || null;
    const reviews = $("#acrCustomerReviewText").text().trim() || null;
    const rating = $("#acrPopover").attr("title") || null;

    res.json({ asin, title, image, price, rating, reviews, bsr });
  } catch (err) {
    console.error("scrape error", err.message);
    res.status(500).json({ error: "fetch_failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("listening on " + PORT));
