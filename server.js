import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// allow all origins (frontend -> backend calls)
app.use(cors());

app.get("/", (req, res) => {
  res.send("Amazon Scraper Proxy is running 🚀");
});

app.get("/product/:asin", async (req, res) => {
  try {
    const { asin } = req.params;
    const url = `https://www.amazon.com/dp/${asin}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);

    const title = $("#productTitle").text().trim() || "";
    const image =
      $("#imgTagWrapperId img").attr("src") ||
      $("#landingImage").attr("src") ||
      "";
    const rating =
      $("#acrPopover span.a-icon-alt").text().trim() || "";
    const reviews = $("#acrCustomerReviewText").text().trim() || "";
    const bsr =
      $("#SalesRank").text().trim() ||
      $("th:contains('Best Sellers Rank')").parent().next().text().trim() ||
      "";

    res.json({ asin, title, image, rating, reviews, bsr });
  } catch (err) {
    console.error("Scraper error:", err.message);
    res.status(500).json({ error: "Failed to scrape product" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
