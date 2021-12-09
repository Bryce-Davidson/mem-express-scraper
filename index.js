const axios = require("axios");
const cheerio = require("cheerio");

const url =
  "https://www.memoryexpress.com/Category/VideoCards?InventoryType=InStock&Inventory=BCVIC1";
const card_class = ".c-shca-icon-item__body-name a";
const key_words = ["RTX", "rtx", "GTX", "gtx"];

function scrape(seconds) {
  let hit = 0;
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
        hit++;
        console.log({ hit, cards });
      })
      .catch((error) => {
        console.log(error);
      });
  }, seconds * 1000);
}

scrape(3);
