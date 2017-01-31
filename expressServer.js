const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session")
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  secret: "mykey",
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(function(req, res, next){

  let user = usersDatabase[req.session.user_id];

  res.locals.current_user = user;
  next();
});

const usersDatabase = {};
const urlDatabase = {};

function generateRandomString() {
  const random = Math.random().toString(36).substring(0, 6);
  return random;
};

function emailIsTaken(email) {
  let taken = false ;
  for (let id in usersDatabase) {
    if (usersDatabase[id].email === email) {
      taken = true;
    }
  }
  return taken;
};

function loggedInCheck(req, res, next){
  console.log('loggedInCheck', req.session);
  if (req.session && req.session.user_id) {
    next();
  } else {
    // go away, or I shall taunt you a second time
    res.status(401).render("please_log_in");
  }
};

function checkURLOwnership(req, res, next) {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404);
    res.send("Tiny URL does not exist");

  } else if (urlDatabase[shortURL].user_id !== req.session.user_id) {
    res.status(403);
    res.send("Tiny URL does not match user");

  } else {
    next();
  }
};

app.get("/urls", loggedInCheck, (req, res) => {
  let temp = 0;
  let templateVars;
  templateVars = { urls: urlDatabase, flag:false, user_id: req.session.user_id };
  res.render("urls_index", templateVars);
});

app.post("/urls", loggedInCheck, (req, res) => {
  const longURL = req.body["longURL"];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    shortURL: shortURL,
    user_id: req.session.user_id
  }
  res.redirect(`/urls/${shortURL}`);
});


function authenticate(email, password) {
  for (let user_id in usersDatabase) {
    let user = usersDatabase[user_id];
    if ((email === user.email) && bcrypt.compareSync(password, user.password)) {
      return user_id;
    }
  }
  return null;
};

app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    res.render("login");
    return;
  }
  res.redirect("/");
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);

  let user_id = authenticate(email, password);

  if (user_id) {
    req.session.user_id = user_id;
    res.redirect("/");
    return;
  } else {
    res.status(401);
    res.send("wrong email or password!");
    res.end();
  }
});

app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    res.render("register");
    return;
  }

  res.redirect("/");
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  const password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    res.status(400);
    res.send("no email");
    return;
  }
  if (emailIsTaken(email)) {
    res.status(400);
    res.send("email is taken");
    return;
  }

  const id = generateRandomString()
  usersDatabase[id] = {
    email: req.body.email,
    password: hashed_password,
    id: id
  }
  req.session.user_id = id;
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  req.session.user_id = "";
  res.redirect("/");
});

app.get("/", (req, res) => {
  if (!req.session.user_id) {
  res.redirect("/login");
  return;
  }
  res.redirect("/urls");
  return;
});

app.get("/urls/new", loggedInCheck, (req, res) => {
  res.render("urls_new");
});

app.post("/urls/:shortUrl/delete", loggedInCheck, (req, res) => {
  const shortUrl = req.params.shortUrl;
  delete urlDatabase[shortUrl];
  res.redirect('/urls');
});

app.post("/urls/:shortURL", loggedInCheck, checkURLOwnership, (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", loggedInCheck, checkURLOwnership, (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let urlEntry = urlDatabase[req.params.shortURL]
  if (urlEntry) {
    res.redirect(urlEntry.longURL);
    return;
  } else {
    res.status(404);
    res.send("URL does not exist");
    return;
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
