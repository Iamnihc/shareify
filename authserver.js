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
  if (req.isAuthenticated()) {
    console.log("hes already logged in!");

    res.redirect("/rooms");
  } else {
    res.render("index", {
      title: "Hey",
      message: "You are not logged in. You need to log in kiddo",
    });
    console.log("Connect from " + req.sessionID);
  }
});

// create the login get and post routes
// various login pages

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Log in to Shareify",
    message: req.query.reason,
    r2: req.query.r2,
  });
});

// create account page
app.get("/create", (req, res) => {
  res.render("signup", {
    title: "Create an account",
    message: "dont use a real password",
  });
});

app.post("/login", (req, res, next) => {
  console.log("in login");
  passport.authenticate("local", (err, user, info) => {
    if (info) {
      console.log(info);
      console.log("SOmething happened i think");
      return res.send(info.message);
    }
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.login(user, (err) => {
      console.log("err");
      console.log(err);
      if (err) {
        return next(err);
      }
      return res.redirect("/rooms");
    });
  })(req, res, next);
});

app.post("/signup", (req, res, next) => {
  console.log("in Signup");
  return res.redirect("/login" + "?reason=sign%20in" + "&r2=home");
});

app.get("/rooms", (req, res) => {
  if (req.isAuthenticated()) {
    // this is the passport uid
    console.log(req.session.passport.user);
    let id = req.session.passport.user;
    let este;
    let uname;
    // gets username or something
    axios.get(`http://localhost:5000/users/${id}`).then((wha) => {
      console.log(wha);
      este = wha.data;
      uname = este.email;
      if ((este.spotify = "")) {
        // do the login ting
      }
    });
    axios.patch(`http://localhost:5000/users/${id}`, { spotify: "" });
    res.render("index", { title: "Hey", message: "you are auth!" });
  } else {
    console.log("user is not auth");
    res.redirect("/login" + "?reason=noauth" + "&r2=rooms");
  }
});

// tell the server what port to listen on
app.listen(3000, () => {
  console.log("Listening on localhost:3000");
});
