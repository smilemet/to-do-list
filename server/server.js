import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";

import index from "./app/routes/index.js";

import db from "./app/models/index.js";
import applyDotenv from "./app/lambdas/applyDotenv.js";

const startServer = async () => {
  const app = express();
  const { mongoURI, port, origin } = applyDotenv(dotenv);

  app.use(express.static("public"));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use("/", index);
  app.use(morgan("dev"));

  app.listen(8080, () => {
    console.log("===========================================");
    console.log("|            서버를 실행합니다.            |");
    console.log("===========================================");
  });
};

startServer();
