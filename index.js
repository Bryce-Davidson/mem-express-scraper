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

var prev_cards = [];

function scrape(next_job) {
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

    const new_cards = cards.filter((card) => !prev_cards.includes(card));

    if (new_cards.length > 0) {
      prev_cards = prev_cards.concat(new_cards);
      console.log(new_cards);
      Promise.all(
        numbers.map((number) => {
          return client.messages.create({
            body: `New Cards: ${new_cards.join("\n\n")}`.replace(
              " ",
              "\u{0020}"
            ),
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
            to: number,
          });
        })
      ).then((messages) => {
        messages.forEach((message) => {
          console.log(`Payload sent to ${message.to}`);
        });
      });
    } else {
      console.log("No new cards...", next_job);
    }
  });
}

const job = new CronJob({
  cronTime: "*/5 * 10-19 * * *",
  onTick: () => {
    const next_job = job.nextDates().format("MMM DD, HH:mm-ss[s] A");
    scrape(next_job);
  },
  start: false,
  timeZone: "America/Vancouver",
});

var server = http.createServer((req, res) => {
  return res.end(`Server is Running...`);
});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  job.start();
});
