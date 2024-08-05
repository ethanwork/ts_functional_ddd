// import express from 'express';

// const app = express();
// app.get('/', (_req, res) => {
//   res.send('Hello world!!');
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Listening on port ${PORT}`);
// });

import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { sum } from "../core/math";
import { HttpRequest, placeOrderApi } from './PlaceOrderApi';

const buildDir = path.join(process.cwd() + "/build");
const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static(buildDir));

app.get("/ping", function (req, res) {
  return res.json(`${sum(10, 4)}`);
});

app.get("/placeorder", function (req, res) {
  const httpRequest: HttpRequest = {
    action: "",
    uri: "",
    body: req.body
  };
  const result = placeOrderApi(httpRequest);
  return res.json(result);
});

app.get("/*", function (req, res) {
  res.sendFile(path.join(buildDir, "index.html"));
});

const port = 3001;
console.log("checking port", port);
app.listen(port, () => {
  console.log(`Server now listening on port: ${port}`);
});