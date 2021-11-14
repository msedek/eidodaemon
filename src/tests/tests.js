const cron = require('cron');


// # ┌────────────── second (optional)
// # │ ┌──────────── minute
// # │ │ ┌────────── hour
// # │ │ │ ┌──────── day of month
// # │ │ │ │ ┌────── month
// # │ │ │ │ │ ┌──── day of week
// # │ │ │ │ │ │
// # │ │ │ │ │ │
// # * * * * * *


// second	0-59
// minute	0-59
// hour	0-23
// day of month	1-31
// month	1-12 (or names)
// day of week	0-7 (or names, 0 or 7 are sunday)


// rimraf('tal.txt',()=>{
//   console.log('ya');
// })
let timer = 0
//sec min hour 12 hours format
console.log("Job Started");
const cronJob = cron.job("* * * * * *", () => {
  console.log(timer);
  timer++
},undefined, true, "America/Lima");

cronJob.start();