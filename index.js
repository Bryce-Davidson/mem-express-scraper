const axios = require("axios");
const cheerio = require("cheerio");
const twilio = require("twilio");

require("dotenv").config();

const url =
  "https://www.memoryexpress.com/Category/VideoCards?InventoryType=InStock&Inventory=BCVIC1";
const card_class = ".c-shca-icon-item__body-name a";
const key_words = ["RTX", "rtx", "GTX", "gtx"];

console.log(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const numbers = process.env.NUMBERS.split(",");
// console.log(numbers);
Promise.all(
  numbers.map((number) => {
    return client.messages.create({
      body: "Hello from the web scraper",
      to: number,
      from: "whatsapp:+14155238886",
    });
  })
)
  .then((messages) => {
    messages.forEach((message) => {
      console.log(messages, `Payload sent to ${message.to.split(":")[1]}`);
    });
  })
  .catch((err) => console.error(err));

function scrape(seconds) {
  let count = 0;
  setInterval(() => {
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
      })
      .catch((error) => {
        console.log(error);
      });
  }, seconds * 1000);
}

// scrape(3);
