const axios = require("axios");
const cheerio = require("cheerio");

require("dotenv").config();

const url =
  "https://www.memoryexpress.com/Category/VideoCards?InventoryType=InStock&Inventory=BCVIC1";
const card_class = ".c-shca-icon-item__body-name a";
const key_words = ["RTX", "rtx", "GTX", "gtx"];

console.log(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// const client = require("twilio")(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

client.messages
  .create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.CELL_PHONE_NUMBER,
    body: "You just sent an SMS from Node.js using Twilio!",
  })
  .then((message) => console.log(message.sid));

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
