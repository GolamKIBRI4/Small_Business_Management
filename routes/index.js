var express = require('express');
var router = express.Router();
const userModel=require("./users");
const ownerModel=require("./owner");
const passport=require("passport");
//for profile update
const multer = require('multer'); // Middleware for handling file uploads
const path = require('path');

//
const LocalStrategy = require('passport-local').Strategy;
passport.use('user-local', new LocalStrategy(userModel.authenticate()));
passport.use('owner-local', new LocalStrategy(ownerModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});
//user home page
router.get('/userhome', function(req, res, next) {
  res.render('userhome');
});
//Owner home page
router.get('/ownerhome', function(req, res, next) {
  res.render('ownerhome');
});
//register a company and owner
router.get("/registercompany", function(req, res) {
  res.render("registercompany");
});

//user profile
router.get('/profile',isLoggedIn ,async function(req, res, next) {
  const user= await userModel.findById(req.user._id);
  res.render('profile', {user});
});
//owner profile
router.get('/ownerprofile', isLoggedIn, async function(req, res, next) {
  const owner = await ownerModel.findById(req.user._id);
  res.render('ownerprofile', { owner });
});

//register a owner
router.post('/registercompany', function(req, res) {

  var ownerData =new ownerModel({
    username: req.body.username,
    companyname: req.body.companyname,
    ownername: req.body.ownername,
    phone: req.body.phone,
    email: req.body.email,
    secret: req.body.secret
  });
ownerModel.register(ownerData,req.body.password).then(function(registeredUser) {
    passport.authenticate('owner-local')(req, res, function() {
       res.redirect('/ownerprofile');
    });
  });
});

//user login
router.post("/login", passport.authenticate("user-local",{
  successRedirect: "/profile",
  failureRedirect: "/"
}), function(req,res){})

//owner login
router.post("/ownerlogin", passport.authenticate("owner-local",{
  successRedirect: "/ownerprofile",
  failureRedirect: "/"
}), function(req,res){});

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

// Route for user profile update
router.post("/update-profile", isLoggedIn, upload.single('photo'), async function(req, res) {
    const updates = {};

  // Only include the fields that were sent by the form
  if (req.body.username) updates.username = req.body.username;
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
