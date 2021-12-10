const axios = require("axios");
const cheerio = require("cheerio");
const twilio = require("twilio");
const moment = require("moment-timezone");
const http = require("http");

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
  const currentTime = moment().tz("America/Vancouver");
  console.log(currentTime);
  const current_time_format = currentTime.format("h:mm A");
  console.log(currentTime);

  console.log("Checking time...");

  const extra = moment().tz("America/Vancouver").format("YYYY-MM-DD") + " ";
  const start_time = moment(extra + "10:00");
  const end_time = moment(extra + "20:00");

  console.log(currentTime, start_time, end_time);

  if (moment(currentTime).isBetween(start_time, end_time)) {
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
  } else {
    console.log("Not time yet...");
  }
}
const minutes = 20;

var server = http.createServer((req, res) => {});

server.listen(process.env.PORT || 80, () => {
  console.log("Listening on port 80");
  scrape();
  setInterval(scrape, minutes * 1000 * 60);
  //   setInterval(() => {
  //     console.log("Server is running...");
  //   }, 1000);
});
