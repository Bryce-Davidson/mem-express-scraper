const axios = require("axios");
const cheerio = require("cheerio");
const twilio = require("twilio");
const CronJob = require("cron").CronJob;
if (process.env.NODE_ENV !== "production") require("dotenv").config();

const numbers = process.env.NUMBERS.split(",");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const url =
  "https://www.memoryexpress.com/Category/VideoCards?InventoryType=InStock&Inventory=BCVIC1";
const card_class = ".c-shca-icon-item__body-name a";
const key_words = ["RTX", "rtx", "GTX", "gtx", "3060", "3070", "3080", "3090"];

let count = 0;
async function scrape() {
  console.log("Scraping...");
  axios
    .get(url)
    .then((response) => {
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

      return Promise.all(
        numbers.map((number) => {
          return client.messages.create({
            body: `
              Update: ${count}\nStock: ${cards.length} cards\n\n${cards.join(
              "\n\n"
            )}`,
            to: number,
            from: "whatsapp:+14155238886",
          });
        })
      );
    })
    .then((messages) => {
      messages.forEach((message) => {
        console.log(`Payload sent to ${message.to.split(":")[1]}`);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}

const job = new CronJob({
  cronTime: "*/30 14-17 10-23 * * *",
  onTick: async () => {
    if (job.taskRunning) return;
    job.taskRunning = true;
    await scrape();
    job.taskRunning = false;
  },
  start: true,
  timeZone: "America/Vancouver",
});
