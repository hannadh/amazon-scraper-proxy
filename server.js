import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/product/:asin", async (req, res) => {
  const { asin } = req.params;
  const url = `https://www.amazon.com/dp/${asin}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);

    // Extract data
    const title =
      $("#productTitle").text().trim() ||
      $("h1 span#title").text().trim();

    const image =
      $("#landingImage").attr("src") ||
      $("#imgTagWrapperId img").attr("src");

    const rating =
      $('span[data-asin][data-args*="stars"]').first().text().trim() ||
      $("span[data-asin][aria-label*='stars']").first().attr("aria-label");

    const reviewsRaw =
      $("#acrCustomerReviewText").text().trim() ||
      $("span[data-asin][data-args*='ratings']").text().trim();

    let reviews = "";
    if (reviewsRaw) {
      const num = parseInt(reviewsRaw.replace(/[^0-9]/g, ""));
      if (!isNaN(num)) {
        reviews = num.toLocaleString(); // ✅ clean formatted number
      }
    }

    // BSR - multiple fallbacks
    let bsr = "";
    const bsrText = $(
      '#detailBullets_feature_div li:contains("Best Sellers Rank"), ' +
        '#productDetails_detailBullets_sections1 tr:contains("Best Sellers Rank"), ' +
        "#SalesRank"
    )
      .text()
      .trim();

    if (bsrText) {
      const match = bsrText.match(/#([\d,]+)/);
      if (match) {
        bsr = match[1];
      }
    }

    res.json({
      asin,
      title,
      image,
      rating,
      reviews,
      bsr,
    });
  } catch (error) {
    console.error("Error scraping:", error.message);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
