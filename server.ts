// ts stuff (we love to see it)
import express from "express";
import path from "path";
import { secrets } from "./secret";
import ClientOAuth2 from "client-oauth2";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
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

app.use(
  session({
    genid: (req: any) => {
      console.log("Inside the session middleware");
      console.log(req.sessionID);
      return uuidv4(); // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: secrets.express.secret,
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "pug");
// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.use(express.static("src"));
// define a route handler for the default home page

app.get("/", (req, res) => {
  // render the index template
  console.log(req.sessionID);
  res.render("index", { title: "Hey", message: "Hello there!" });
});

io.on("connection", function (socket: any) {
  console.log("a user connected");
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
