const express = require("express");
const http = require("http");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const request = require("request");
const port = process.env.PORT || 3002;
const server = http.createServer(app);

const configs = require("./src/configs/configs");

const resend = require("./src/routes/resendRoutes");

const URL_DAEMON = configs.urlDaemon;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb", extended: true }));
app.use(resend);

server.listen(port, () => {
  console.clear();
  console.log(`Running on port ${port}`);
});

const awakeDaemon = () => {
  return new Promise((resolve, reject) => {
    request.post(URL_DAEMON, (err, response, body) => {
      resolve("done");
    });
  });
};

awakeDaemon().catch(err => console.log(err));
