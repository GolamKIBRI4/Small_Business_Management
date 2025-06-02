var express = require('express');
var router = express.Router();
const userModel=require("./users");
const passport=require("passport");
const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/profile',isLoggedIn ,function(req, res, next) {
  res.render('profile', { username: req.user.username });
});

router.post('/register', function(req, res) {

  var userData =new userModel({
    username: req.body.username,
    secret: req.body.secret
  });
userModel.register(userData,req.body.password).then(function(registeredUser) {
    passport.authenticate('local')(req, res, function() {
       res.redirect('/profile');
    });
  });
});

router.post("/login", passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/"
}), function(req,res){})

router.get('/logout', function(req, res,next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
router.get("/login", function(req, res) {
  res.render("login");
});
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}
module.exports = router;
