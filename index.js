const axios = require("axios");
const cheerio = require("cheerio");
const twilio = require("twilio");
const moment = require("moment");
const express = require("express");

var app = express();
var port = process.env.PORT || 8000;

if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}

// console.log(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const url =
  "https://www.memoryexpress.com/Category/VideoCards?InventoryType=InStock&Inventory=BCVIC1";
const card_class = ".c-shca-icon-item__body-name a";
const key_words = ["RTX", "rtx", "GTX", "gtx"];

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const numbers = process.env.NUMBERS.split(",");
// console.log(numbers);

let count = 0;
function scrape() {
  const currentTime = moment();
  const current_time_format = currentTime.format("h:mm A");

  const extra = moment().format("YYYY-MM-DD") + " ";
  const start_time = moment(extra + "10:00");
  const end_time = moment(extra + "20:00");

  if (moment(currentTime).isBetween(start_time, end_time)) {
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
}
const minutes = 20;

app.listen(process.env.PORT || 5000, () => {
  scrape();
  setInterval(scrape, minutes * 1000 * 60);
});

module.exports = app;
