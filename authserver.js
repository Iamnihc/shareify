//npm modules
const express = require("express");
const { v4: uuid } = require("uuid");
const path = require("path");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const axios = require("axios");
const bcrypt = require("bcryptjs");

// configure passport.js to use the local strategy
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    axios
      .get(`http://localhost:5000/users?email=${email}`)
      .then((res) => {
        const user = res.data[0];
        if (!user) {
          return done(null, false, { message: "Invalid credentials.\n" });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: "Invalid credentials.\n" });
        }
        return done(null, user);
      })
      .catch((error) => done(error));
  })
);

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  axios
    .get(`http://localhost:5000/users/${id}`)
    .then((res) => done(null, res.data))
    .catch((error) => done(error, false));
});

// create the server
const app = express();

// add & configure middleware
app.set("view engine", "pug");
// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.use(express.static("src"));

// express stuff

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    genid: (req) => {
      console.log("Inside session middleware genid function");
      console.log(`Request object sessionID from client: ${req.sessionID}`);
      return uuid(); // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// create the homepage route at '/'
app.get("/", (req, res) => {
  res.render("index", {
    title: "Hey",
    message: "Home page. Go to /authrequired or /login or somethign liek that",
  });
});

// create the login get and post routes
app.get("/login", (req, res) => {
  res.send(`You got the login page!\n`);
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (info) {
      return res.send(info.message);
    }
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/authrequired");
    });
  })(req, res, next);
});

app.get("/authrequired", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("index", { title: "Hey", message: "you are auth!" });
  } else {
    res.redirect("/");
  }
});

// tell the server what port to listen on
app.listen(3000, () => {
  console.log("Listening on localhost:3000");
});
