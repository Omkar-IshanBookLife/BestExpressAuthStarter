var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
var session = require("express-session");
var LocalStrategy = require("passport-local").Strategy;
var path = require("path")

const app = express();

mongoose.connect("mongodb://localhost/passport-auth", () => {
  console.log("Connected to Database Successfuly");
  app.listen(3000, () => console.log("App Listening on Port 3000"));
});

var User = require("./models/user");

app.use(
  session({
    name: "session-id",
    secret: "123-456-789",
    saveUninitialized: false,
    resave: false,
  })
);

app.set("view engine", "ejs")
app.set("views", "./views")

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const router = express.Router();

router.get("/", (req, res)=>{
  res.render("index")
})

router.get("/user", (req, res) => {
  res.json(req.user);
});

router.post("/signup", (req, res, next) => {
  User.register(
    new User({
      username: req.body.username,
    }),
    req.body.password,
    (err, user) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.json({
          err: err,
        });
      } else {
        passport.authenticate("local")(req, res, () => {
          User.findOne(
            {
              username: req.body.username,
            },
            (err, person) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json({
                success: true,
                status: "Registration Successful!",
              });
            }
          );
        });
      }
    }
  );
});

router.post("/login", passport.authenticate("local"), (req, res) => {
  User.findOne(
    {
      username: req.body.username,
    },
    (err, person) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        status: "You are successfully logged in!",
      });
    }
  );
});

router.get("/logout", (req, res, next) => {
  if (req.session) {
    req.logout();
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.clearCookie("session-id");
        res.json({
          message: "You are successfully logged out!",
        });
      }
    });
  } else {
    var err = new Error("You are not logged in!");
    err.status = 403;
    next(err);
  }
});

app.use("/",router)
