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
function scrape() {
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
      console.log({ count, time: current_time_format, cards });

      return Promise.all(
        numbers.map((number) => {
          return client.messages.create({
            body: `
              Update: ${count}\nStock: ${
              cards.length
            } cards\n${current_time_format}\n\n${cards.join("\n\n")}`,
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

const onTick = (onComplete) => {
  console.log("You will see this message every second");
  onComplete();
};

const onComplete = () => {
  console.log("Job completed");
};

var job = new CronJob(
  "* * * * * *",
  onTick,
  onComplete,
  true,
  "America/Vancouver"
);
