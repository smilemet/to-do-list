import express from "express";
import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import applyDotenv from "./app/lambdas/applyDotenv.js";
import methodOverride from "method-override";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";

const startServer = async () => {
  const app = express();
  const __dirname = path.resolve();
  const { mongoURI, port, origin } = applyDotenv(dotenv);
  let db;

  app.use(express.urlencoded({ extended: true })); // body-parser 관련은 최상단에!
  app.use(express.text());
  app.use(express.json()); // 이거 안하면 body에 아무 데이터도 안 들어온다!!

  app.use(methodOverride("X-HTTP-Method"));
  app.use(methodOverride("X-HTTP-Method-Override"));
  app.use(methodOverride("X-Method-Override"));
  app.use(methodOverride("_method"));

  app.set("view engine", "ejs");
  app.use(express.static("public"));

  app.use(session({ secret: "비밀코드", resave: true, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  MongoClient.connect(mongoURI, (err, client) => {
    if (err) return console.error(err);
    db = client.db("todoapp");

    app.listen(8080, () => {
      console.log("===========================================");
      console.log("|            서버를 실행합니다.            |");
      console.log("===========================================");
    });
  });

  /*-------------------------------
   * GET 요청
   -------------------------------*/
  app.get("/", (req, res) => res.render("index.ejs"));
  app.get("/login", (req, res) => res.render("login.ejs"));
  app.get("/write", (req, res) => res.render("write.ejs"));
  app.get("/mypage", checkLogin, (req, res) => res.render("mypage.ejs", { data: req.user }));

  app.get("/edit/:id", (req, res) => {
    let id = parseInt(req.params.id);

    db.collection("post").findOne({ _id: id }, (err, result) => {
      if (err) console.error(err);
      res.render("edit.ejs", { data: result });
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

  app.get("/search", (req, res) => {
    let options = [
      {
        $search: {
          index: "default",
          text: {
            query: req.query.value,
            path: "title",
          },
        },
      },
      { $sort: { _id: 1 } }, // 정렬
      { $limit: 10 }, // 상위 10개
      { $project: { title: 1, _id: 0, score: { $meta: "searchScore" } } }, // 1 데이터 가져오기 0 가져오지 않기
    ];

    db.collection("post")
      .aggregate(options)
      .toArray((err, result) => {
        if (err) return console.error(err);
        res.render("search.ejs", { data: result });
      });
  });

  /*-------------------------------
   * POST 요청
   -------------------------------*/
  app.post("/login", passport.authenticate("local", { failureRedirect: "/fail" }), (req, res) => {
    res.redirect("/");
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
              res.redirect("/list");
            }
          );
        }
      );
    });
  });

  app.post("/register", (req, res) => {
    db.collection("login").insertOne({ id: req.body.id, pw: req.body.pw }, (err, result) => {
      if (err) console.error(err);
      res.redirect("/");
    });
  });

  /*-------------------------------
   * PUT 요청
   -------------------------------*/
  app.put("/edit", (req, res) => {
    db.collection("post").updateOne(
      { _id: parseInt(req.body.id) },
      { $set: { title: req.body.title, date: req.body.date } },
      (err, result) => {
        if (err) console.error(err);
        console.log("수정완료");
        res.redirect("/list");
      }
    );
  });

  /*-------------------------------
   * DELETE 요청
   -------------------------------*/
  // 글 삭제
  app.delete("/delete", (req, res) => {
    req.body._id = parseInt(req.body._id);
    db.collection("post").deleteOne(req.body, (err, result) => {
      console.log("삭제완료");
    });
    res.send("삭제완료");
  });

  /*-------------------------------
   * 로그인 설정
   -------------------------------*/
  passport.use(
    new LocalStrategy(
      // 설정
      {
        usernameField: "id",
        passwordField: "pw",
        session: true, // 만들어줘야 재로그인 X
        passReqToCallback: false, // id, pw 외에 다른 정보 검사 시 true로 변경
      },
      // 아이디, 비밀번호 검사 코드
      // 실적용시 꼭 암호화한 pw와 비교할 것!
      (userId, userPw, done) => {
        db.collection("login").findOne({ id: userId }, (err, result) => {
          if (err) return done(err);
          if (!result) return done(null, false, { message: "존재하지 않는 아이디입니다." });

          if (userPw == result.pw) return done(null, result);
          else return done(null, false, { message: "비밀번호가 맞지 않습니다." });
        });
      }
    )
  );

  // 유저 id로 세션데이터 생성 -> 쿠키 만들어 전송
  passport.serializeUser((user, done) => done(null, user.id));

  // 방문자에게 세션아이디 쿠키가 존재하면 req.user 데이터 생성
  passport.deserializeUser((id, done) => {
    db.collection("login").findOne({ id: id }, (err, result) => {
      if (err) console.error(err);
      done(null, result);
    });
  });

  function checkLogin(req, res, next) {
    if (req.user) next();
    else res.send("로그인이 필요합니다.");
  }
};

startServer();
