import express from "express";
import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import applyDotenv from "./app/lambdas/applyDotenv.js";

const startServer = async () => {
  const app = express();
  const __dirname = path.resolve();
  const { mongoURI, port, origin } = applyDotenv(dotenv);

  app.set("view engine", "ejs");

  app.use(express.static("public"));
  app.use(express.urlencoded({ extended: true }));

  MongoClient.connect(mongoURI, (err, client) => {
    if (err) return console.error(err);
    db = client.db("todoapp");

    app.listen(8080, () => {
      console.log("===========================================");
      console.log("|            서버를 실행합니다.            |");
      console.log("===========================================");
    });
  });

  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
  });

  app.get("/write", (req, res) => {
    res.sendFile(__dirname + "/write.html");
  });

  app.post("/add", (req, res) => {
    db.collection("counter").findOne({ name: "게시물수" }, (err, result) => {
      if (err) return console.error(err);

      let totalPost = result.totalPost;
      db.collection("post").insertOne(
        { _id: totalPost, title: req.body.title, date: req.body.date },
        () => {
          db.collection("counter").updateOne(
            { name: "게시물수" },
            { $inc: { totalPost: 1 } },
            () => {
              console.log("저장 완료");
              res.send("저장 완료!");
            }
          );
        }
      );
    });
  });

  app.get("/list", (req, res) => {
    db.collection("post")
      .find()
      .toArray((err, result) => {
        if (err) return console.error(err);
        res.render("list.ejs", { data: result });
      });
  });

  let db;
};

startServer();
