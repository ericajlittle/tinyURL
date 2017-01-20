const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = process.env.PORT || 8080;


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.use(function(req, res, next){

  let user = usersDatabase[req.cookies.user_id];

  // user is either going to be a user object, or undefined

  res.locals.current_user = user;
  next();
});

app.set("view engine", "ejs");

const usersDatabase = {

  // "fhuweife": {
  //   email: "someone@example.com",
  //   password: "supersecret",
  //   id: "fhuweife"

  // }

};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
function generateRandomString() {
  const random = Math.random().toString(36).substring(0, 6);
  return random;
}

app.get("/", (req, res) => {
  res.redirect("/urls");
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

// Logout user
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


function authenticate(email, password) {
  for (let user_id in usersDatabase) {
    let user = usersDatabase[user_id];

    if (email === user.email) {
      if (password === user.password) {
        return user_id;
      } else {
        // found email but password didn't match
        return null;
      }
    }
  }
  // didn't find user for that email
  return null;
}

// Login user
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  let user_id = authenticate(email, password);

  if (user_id) {
    res.cookie("user_id", user_id);
    res.redirect("/");
  }
  else {
    res.send(403, "<html><body>Wrong email or password</body></html>\n");
    res.end();
  }
});


app.get("/register", (req, res) => {
  res.render("register");
});
// Register user
app.post("/register", (req, res) => {
  const id = generateRandomString()
  usersDatabase[id] = {
    email: req.body.email,
    password: req.body.password,
    id: id
  }
  res.cookie("user_id", id);
  res.redirect("/");

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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortUrl", (req, res) => {
  let templateVars = { shortURL: req.params.shortUrl, longURL: urlDatabase[req.params.shortUrl] };
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