const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
function generateRandomString() {
  const random = Math.random().toString(36).substring(0, 6);
  return random;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls/new", (req, res) => {

  res.render("urls_new");
});

// Index
app.post("/urls", (req, res) => {
  const longURL = req.body["longURL"];
  const shortURL = generateRandomString();
  console.log(longURL);
  console.log(shortURL);
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect(302, "/urls/"+shortURL);
});

//
app.post("/urls/logout", (req, res) => {
  let username = req.body.username;
  res.clearCookie('username');

  res.redirect('/urls');
});

// Login
app.post("/urls/login", (req, res) => {
  let username = req.body.username;
  res.cookie("username", username);
  res.redirect('/urls');
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  const shortUrl = req.params.shortUrl;
  delete urlDatabase[shortUrl];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
  res.end();
});


app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortUrl", (req, res) => {
  let templateVars = { username: req.cookies["username"], shortURL: req.params.shortUrl, longURL: urlDatabase[req.params.shortUrl] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (longURL != null) {
  res.redirect(longURL);
  } else {
    res.end("ERROR");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});