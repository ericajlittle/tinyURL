const express = require("express");
// const cookieParser = require('cookie-parser')
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session")

const bodyParser = require("body-parser");


app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser())
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  secret: "mykey",

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(function(req, res, next){

  let user = usersDatabase[req.session.user_id];

  res.locals.current_user = user;
  //find out what next is
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
  if (res.locals.current_user) {
    next();
  } else {
    // go away, or I shall taunt you a second time
    res.status(401).render("please_log_in");
  }
}

app.get("/urls", loggedInCheck, (req, res) => {
  let temp = 0;
  let templateVars;
  templateVars = { urls: urlDatabase, flag:false, user_id: res.locals.current_user.id };
  res.render("urls_index", templateVars);
});

app.post("/urls", loggedInCheck, (req, res) => {
  // if (!res.locals.current_user) {
  //   res.status(401).render("please_log_in");
  //   return;
  // }
  const longURL = req.body["longURL"];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    shortURL: shortURL,
    user_id: res.locals.current_user.id
  }
  // just changed from /urls
  res.redirect(302, "/urls");
});


function authenticate(email, password) {
  for (let user_id in usersDatabase) {
    let user = usersDatabase[user_id];
    if ((email === user.email) && bcrypt.compareSync(password, user.password)) {
      return user_id;
    }
  }
  return null;
}
app.get("/login", (req, res) => {
  res.render("login");
})

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);

  let user_id = authenticate(email, password);

  if (user_id) {
    req.session.user_id = user_id;
    // res.cookie("user_id", user_id);
    res.redirect("/");
  } else {
    res.status(401);
    res.send("wrong email or password!");
    res.end();
  }
});

app.get("/register", (req, res) => {
  res.render("register");
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
    //changed but might not work
    password: hashed_password,
    id: id
  }
  // res.cookie("user_id", id);
  req.session.user_id = id;
  res.redirect("/");

});

app.post("/logout", (req, res) => {
  req.session.user_id = "";
  //res.clearCookie('user_id');
  res.redirect("/login");
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls/new", loggedInCheck, (req, res) => {

  // if (!res.locals.current_user) {
  //   res.redirect(401, "/login");
  //   return;
  // }
  res.render("urls_new");
});


app.post("/urls/:shortUrl/delete", loggedInCheck, (req, res) => {
  // if (!res.locals.current_user) {
  //   res.redirect(401, "/login");
  //   return;
  // }
  const shortUrl = req.params.shortUrl;
  delete urlDatabase[shortUrl];
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});



app.get("/urls/:shortURL", loggedInCheck, (req, res) => {
  // TODO: figure out if we have an error

  // if (urlDatabase.user_id !== res.locals.current_user) {
  //   res.status(403);
  //   res.send("Tiny URL does not match user");
  // }
  if (urlDatabase.shortURL === undefined) {
    res.status(404);
    res.send("Tiny URL does not exist");
  }
// TODO figure out how to check if user matches shortURL

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  for (let id in urlDatabase) {
    if (id === req.params.shortURL) {
      let longURL = urlDatabase[id].longURL;
      res.redirect(longURL);
    }
  }
  res.redirect(404, "/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});