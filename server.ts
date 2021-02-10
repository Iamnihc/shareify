// ts stuff (we love to see it)
import express from "express";
import path from "path";
import { secrets } from "./secret";
import ClientOAuth2 from "client-oauth2";
import session from "express-session";
import { v4 as uuid } from "uuid";
import http from "http";
import socketIO from "socket.io";
import sessionFileStore from "session-file-store";
import bodyParser from "body-parser";
import passport from "passport";
import passportLocalStrategy from "passport-local";
import axios from "axios";
import bcrypt from "bcryptjs";
import { isTypeAliasDeclaration } from "typescript";

let LocalStrategy = passportLocalStrategy.Strategy;

const port = 8080; // default port to listen

const app = express();
let server = new http.Server(app);
let io = new socketIO.Server(server);
const FileStore = sessionFileStore(session);

class Song {
  title: string;
  artist: string;
  album: string;
  duration: number;
  spotifyUri: string;
  appleUri: string;
  tidalUri: string;
}

interface MusicService {
  keyed: boolean;
  keyobject: Record<any, any>;
  validate(keys:any):void;
  findSongByName(search: string): Song;
  playSong(toPlay: Song): any;
}

class Spotify implements MusicService {
  keyobject: Record<any, any>;
  keyed: boolean;
  constructor() {
    this.keyed = false;
  }
  validate(keys: any): void {
    throw new Error("Method not implemented.");
  }

  playSong(toPlay: Song) {
    throw new Error("Method not implemented.");
  }

  findSongByName(search: string): Song {
    throw new Error("Method not implemented.");
  }
}
class Tidal implements MusicService {
  validate(keys: any): void {
    throw new Error("Method not implemented.");
  }
  keyobject: Record<any, any>;
  playSong(toPlay: Song) {
    throw new Error("Method not implemented.");
  }
  keyed: boolean;
  findSongByName(search: string): Song {
    throw new Error("Method not implemented.");
  }
}

class Apple implements MusicService {
  validate(keys: any): void {
    throw new Error("Method not implemented.");
  }
  keyobject: Record<any, any>;
  playSong(toPlay: Song) {
    throw new Error("Method not implemented.");
  }
  keyed: boolean;
  findSongByName(search: string): Song {
    throw new Error("Method not implemented.");
  }
}

class User {
  music = {
    spotify: new Spotify(),
    tidal: new Tidal(),
    applie: new Apple(),
  };
  default = this.music.spotify;
  constructor() {}
}

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
passport.serializeUser<any, any>((user, done: Function) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  axios
    .get(`http://localhost:5000/users/${id}`)
    .then((res) => done(null, res.data))
    .catch((error) => done(error, false));
});


io.on("connection", function (socket: any) {
  console.log("a user connected");
});



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
  //axios.patch(`http://localhost:5000/users/${id}`, { music: "" });
});

app.get("/rooms", (req:any, res) => {
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
    res.render("index", { title: "Hey", message: "you are auth!",  });
  } else {
    console.log("user is not auth");
    res.redirect("/login" + "?reason=noauth" + "&r2=rooms");
  }
});

// tell the server what port to listen on
app.listen(3000, () => {
  console.log("Listening on localhost:3000");
});


var spotifyAuth = new ClientOAuth2({
  clientId: secrets.spotify.id,
  clientSecret: secrets.spotify.secret,
  accessTokenUri: "https://accounts.spotify.com/api/token",
  authorizationUri: "https://accounts.spotify.com/authorize",
  redirectUri: "http://localhost:3000/callback",
  scopes: secrets.spotify.scopeArr,
});

app.get("/spotlogin", function (req, res) {
  var uri = spotifyAuth.code.getUri();

  res.redirect(uri);
});

app.get("/callback", function (req, res) {
  spotifyAuth.code.getToken(req.originalUrl).then(function (user) {
    console.log(user); //=> { accessToken: '...', tokenType: 'bearer', ... }

    // Refresh the current users access token.
    user.refresh().then(function (updatedUser) {
      console.log(updatedUser !== user); //=> true
      console.log(updatedUser.accessToken);
    });

    // Sign API requests on behalf of the current user.
    user.sign({
      method: "get",
      url: `http://localhost:${port}/`,
    });

    // We should store the token into a database.
    return res.send(user.accessToken);
  });
});

server.listen(port, function () {
  console.log(`listening on *:${port}`);
});
