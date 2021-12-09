const moment = require("moment");

setInterval(() => {
  const currentTime = moment();

  const extra = moment().format("YYYY-MM-DD") + " ";
  const start_time = moment(extra + "10:00");
  const end_time = moment(extra + "20:00");

  if (moment(currentTime).isBetween(start_time, end_time)) console.log("TRUE");
}, 1000);
