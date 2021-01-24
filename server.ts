import express from "express";
import path from "path";
import { secrets } from "./secret";
import https from "https";
import ClientOAuth2 from "client-oauth2";
const app = express();
const port = 8080; // default port to listen
let http = require("http").Server(app);
let io = require("socket.io")(http);

app.set("view engine", "pug");
// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.use(express.static("src"));
// define a route handler for the default home page
app.get("/", (req, res) => {
  // render the index template
  res.render("index", { title: "Hey", message: "Hello there!" });
});

io.on("connection", function (socket: any) {
  console.log("a user connected");
});

// start the express server
// app.listen(port, () => {
//   // tslint:disable-next-line:no-console
//   console.log(`server started at http://localhost:${port}`);
// });
var spotifyAuth = new ClientOAuth2({
  clientId: secrets.spotify.id,
  clientSecret: secrets.spotify.secret,
  accessTokenUri: "https://accounts.spotify.com/api/token",
  authorizationUri: "https://accounts.spotify.com/authorize",
  redirectUri: "http://localhost:3000/callback",
  scopes: secrets.spotify.scopeArr,
});
app.get("/login", function (req, res) {
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
      url: "http://localhost:3000/",
    });

    // We should store the token into a database.
    return res.send(user.accessToken);
  });
});
const server = http.listen(3000, function () {
  console.log("listening on *:3000");
});
