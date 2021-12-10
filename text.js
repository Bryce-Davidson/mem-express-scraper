const axios = require("axios");
const cheerio = require("cheerio");
const CronJob = require("cron").CronJob;
if (process.env.NODE_ENV !== "production") require("dotenv").config();

const url =
  "https://www.memoryexpress.com/Category/VideoCards?InventoryType=InStock&Inventory=BCVIC1";
const card_class = ".c-shca-icon-item__body-name a";
const key_words = ["RTX", "rtx", "GTX", "gtx", "3060", "3070", "3080", "3090"];

let count = 0;
async function scrape() {
  console.log("Scraping...");
  axios.get(url).then((response) => {
    const $ = cheerio.load(response.data);
    const cards = $(card_class)
      .filter((i, el) => {
        $(el).find("span").remove();
        const text = $(el).text().trim();
        return key_words.some((key) => text.includes(key));
      })
      .map((i, el) => {
        return $(el).text().trim();
      })
      .get();
    count++;
    console.log({ count, cards });
  });
}

const job = new CronJob({
  cronTime: "*/20 10-20 * * *",
  onTick: async () => {
    if (job.taskRunning) return;
    job.taskRunning = true;
    await scrape();
    job.taskRunning = false;
  },
  start: true,
  timeZone: "America/Vancouver",
});
