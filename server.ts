import express from "express";
import path from "path";

const app = express();
const port = 8080; // default port to listen
let http = require("http").Server(app);
let io = require("socket.io")(http);

app.set("view engine", "pug");
// Configure Express to use EJS
app.set("views", path.join(__dirname, "views"));
app.use(express.static("src"));
// define a route handler for the default home page
app.get("/", (req: any, res: any) => {
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

app.get("/login", function (req, res) {
  var scopes = "user-read-private user-read-email";
  res.redirect(
    "https://accounts.spotify.com/authorize" +
      "?response_type=code" +
      "&client_id=" +
      my_client_id +
      (scopes ? "&scope=" + encodeURIComponent(scopes) : "") +
      "&redirect_uri=" +
      encodeURIComponent("localhost:3000")
  );
});

const server = http.listen(3000, function () {
  console.log("listening on *:3000");
});
