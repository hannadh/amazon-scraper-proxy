import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

// Utility: clean text
function clean(text) {
  return text ? text.replace(/\s+/g, " ").trim() : "";
}

// Fetch product data by ASIN
app.get("/product/:asin", async (req, res) => {
  const asin = req.params.asin;
  const url = `https://www.amazon.com/dp/${asin}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);

    // Title
    const title = clean($("#productTitle").text());

    // Image
    let image =
      $("#imgTagWrapperId img").attr("src") ||
      $("#landingImage").attr("src") ||
      "";

    // Rating
    const rating = clean($("span[data-asin][data-avg-rating]").attr("data-avg-rating") ||
      $("span[data-asin][data-star-rating]").attr("data-star-rating") ||
      $("span[data-asin][data-asin-popover]").attr("title") ||
      $("span.a-icon-alt").first().text()
    );

    // Reviews
    let reviews =
      clean($("#acrCustomerReviewText").text()) ||
      clean($("#acrCustomerReviewLink #acrCustomerReviewText").text());
    reviews = reviews.replace(/[^0-9,]/g, ""); // keep commas

    // BSR (main + sub)
    let main_bsr = "";
    let sub_bsr = [];

    const bsrText =
      $("#detailBullets_feature_div li:contains('Best Sellers Rank')").text() ||
      $("#productDetails_detailBullets_sections1 tr:contains('Best Sellers Rank')").text() ||
      $("#SalesRank").text();

    if (bsrText) {
      const matches = bsrText.match(/#([\d,]+)/g); // all ranks like "#12,407"
      if (matches && matches.length > 0) {
        main_bsr = matches[0].replace("#", "");
        if (matches.length > 1) {
          sub_bsr = matches.slice(1).map((m) => m.replace("#", ""));
        }
      }
    }

    res.json({
      asin,
      title,
      image,
      rating,
      reviews,
      main_bsr,
      sub_bsr,
    });
  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Failed to fetch product data" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Amazon Scraper Proxy is running");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
