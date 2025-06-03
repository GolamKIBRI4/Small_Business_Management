var express = require('express');
var router = express.Router();
const userModel=require("./users");
const passport=require("passport");
//for profile update
const multer = require('multer'); // Middleware for handling file uploads
const path = require('path');

const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/profile',isLoggedIn ,async function(req, res, next) {
  const user= await userModel.findById(req.user._id);
  res.render('profile', {user});
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique name
  }
});

const upload = multer({ storage: storage });

// Route for profile update
router.post("/update-profile", isLoggedIn, upload.single('photo'), async function(req, res) {
    const updates = {};

  // Only include the fields that were sent by the form
  if (req.body.phone) updates.phone = req.body.phone;
  if (req.body.route) updates.route = req.body.route;
  if (req.file) updates.photo = req.file.filename;

  try {
    await userModel.findByIdAndUpdate(req.user._id, updates);
    res.redirect('/profile');
  } catch (err) {
    console.error("❌ Profile update failed:", err);
    res.status(500).send("Something went wrong.");
  }

});

module.exports = router;
