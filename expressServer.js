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



};
function generateRandomString() {
  const random = Math.random().toString(36).substring(0, 6);
  return random;
}

function emailIsTaken(email) {
  let taken = false ;
  for (let id in usersDatabase) {
    if (usersDatabase[id].email === email) {
      taken = true;
    }
  }
  return taken;
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  if (!res.locals.current_user) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new");
});

// Index
app.post("/urls", (req, res) => {
  if (!res.locals.current_user) {
    res.sendStatus(401);
    return;
  }
  const longURL = req.body["longURL"];
  const shortURL = generateRandomString();
  console.log(longURL);
  console.log(shortURL);
  let personalUser = urlDatabase[res.locals.current_user.id]
  if (!personalUser) {
    urlDatabase[res.locals.current_user.id] = {};
    personalUser = urlDatabase[res.locals.current_user.id]
  };
  personalUser[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect(302, "/urls/"+shortURL);
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
app.get("/login", (req, res) => {
  res.render("login");
})
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
    res.send(403);
    res.end();
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Register user
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
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
    password: req.body.password,
    id: id
  }
  console.log(usersDatabase);
  res.cookie("user_id", id);
  res.redirect("/");

});

// Logout user
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  const shortUrl = req.params.shortUrl;
  delete urlDatabase[shortUrl];
  res.redirect('/urls');
});

// Create new
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  let personalUser = urlDatabase[res.locals.current_user.id]
  if (!personalUser) {
    urlDatabase[res.locals.current_user.id] = {};
    personalUser = urlDatabase[res.locals.current_user.id]
  };
  personalUser[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
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
  for (let id in urlDatabase) {
    for (let shortURL in urlDatabase[id])
     { console.log(id, shortURL, req.params.shortURL);
      if (req.params.shortURL === shortURL) {
        let longURL = urlDatabase[id][shortURL];
        res.redirect(longURL);
        return;
      }
    }
  }


   res.end("ERROR");

});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});