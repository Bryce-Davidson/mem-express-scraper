const axios = require("axios");
const cheerio = require("cheerio");
const twilio = require("twilio");
const cron = require("cron");
const CronJob = cron.CronJob;
const http = require("http");
const { prev } = require("cheerio/lib/api/traversing");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

const numbers = process.env.NUMBERS.split(",");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const url =
  "https://www.memoryexpress.com/Category/VideoCards?InventoryType=InStock&Inventory=BCVIC1";
const card_class = ".c-shca-icon-item__body-name a";
const key_words = [
  "GeForce",
  "RTX",
  "rtx",
  "GTX",
  "gtx",
  "3060",
  "3070",
  "3080",
  "3090",
];

let prev_cards;

async function scrape(next_job) {
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

    const send_text = prev_cards !== cards.join(",");
    console.log({ prev_cards, cards: cards.join(",") });
    prev_cards = cards.join(",");
    console.log({ prev_cards, cards: cards.join(",") });

    if (send_text) {
      return Promise.all(
        numbers.map((number) => {
          return client.messages.create({
            body: `
            \nStock: ${cards.length}\n\n${cards
              .map((card) => {
                return card.split("GB")[0] + "GB";
              })
              .join("\n\n")}`.replace(" ", "\u{0020}"),
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
            to: number,
          });
        })
      ).then((messages) => {
        messages.forEach((message) => {
          console.log(`Payload sent to ${message.to}`);
        });
      });
    }
  });
}

const job = new CronJob({
  cronTime: "*/10 * 10-19 * * *",
  onTick: async (onComplete) => {
    if (job.taskRunning) return;
    job.taskRunning = true;

    const next_job = job.nextDates().format("MMM DD, HH:mm-ss[s] A");
    await scrape(next_job).then(onComplete).catch(console.log);

    job.taskRunning = false;
  },
  onComplete: async () => {
    console.log("Scraping completed");
    console.log(
      `Next job at: ${job.nextDates().format("MMM DD, HH:mm-ss[s] A")}`
    );
  },
  start: false,
  timeZone: "America/Vancouver",
});

const health_check = new CronJob({
  cronTime: "*/10 * * * *",
  onTick: () => {
    console.log("Server is Running...");
    console.log(`Next Job: ${job.nextDates().format("MMM DD, HH:mm A")}`);
  },
  start: false,
  timeZone: "America/Vancouver",
});

var server = http.createServer((req, res) => {
  return res.end(
    `Server is Running...\n\nNext Job: ${job
      .nextDates()
      .format("MMM DD, HH:mm A")}`
  );
});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  job.start();
  health_check.start();
  health_check.fireOnTick();
});
