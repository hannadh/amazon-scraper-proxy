import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

// Product scraping route
app.get("/product/:asin", async (req, res) => {
  const { asin } = req.params;
  try {
    const url = `https://www.amazon.com/dp/${asin}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(response.data);

    // Extract product info
    const title = $("#productTitle").text().trim();
    const image = $("#landingImage").attr("src");
    const rating = $("span.a-icon-alt").first().text().trim();
    const reviews = $("#acrCustomerReviewText").text().trim();
    const bsr =
      $("#SalesRank").text().trim() ||
      $("th:contains('Best Sellers Rank')").next().text().trim();

    res.json({ asin, title, image, rating, reviews, bsr });
  } catch (err) {
    console.error("Scraping error:", err.message);
    res.status(500).json({ error: "Failed to fetch product data" });
  }
});

// Render requires listening on process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
