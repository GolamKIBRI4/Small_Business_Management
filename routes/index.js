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
  res.render('profile', {user:user,
    error: req.flash('error'),
    success: req.flash('success') 
    });
});
//owner profile
router.get('/ownerprofile', isLoggedIn, async function(req, res, next) {
  const owner = await ownerModel.findById(req.user._id);
  const users = await userModel.find({ owner: owner._id }); // Fetch users associated with this owner
  res.render('ownerprofile', { owner: owner,  
    users: users,
    error: req.flash('error'),
  success: req.flash('success') 
});
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
//register a user
router.post('/create-user',isLoggedIn,async function(req, res) {
try{
const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    owner: req.user._id, // Associate with the logged-in owner
    tempPassword: req.body.password, // Store temporary password
    isFirstLogin: true // Mark as first login
});
const registeredUser = await userModel.register(userData, req.body.password);
 req.flash("success", "✅ User created. Password can be copied until first login.");
    res.redirect('/ownerprofile');
}catch(err) {
  console.error("❌ User registration failed:", err);
  req.flash("error", "❌ User registration failed. Please try again.");
  res.redirect('/ownerprofile');
}});

//user login
router.post("/login", (req, res, next) => {
  passport.authenticate("user-local", async (err, user, info) => {
    if (err || !user) return res.redirect('/');
    
    req.logIn(user, async (err) => {
      if (err) return next(err);
      
      if (user.isFirstLogin) {
        return res.redirect('/reset-password'); // show reset page
      } else {
        return res.redirect('/profile');
      }
    });
  })(req, res, next);
});


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

//password reset for first login
// This route is for users who are logging in for the first time and need to set their password
router.get('/reset-password', isLoggedIn, (req, res) => {
  res.render('reset-password');
});

router.post('/reset-password', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    await user.setPassword(req.body.newPassword);
    user.isFirstLogin = false;
    user.tempPassword = undefined;
    await user.save();
    req.flash('success', '✅ Password reset successful!');
    res.redirect('/profile');
  } catch (err) {
    console.error("❌ Password reset error:", err);
    req.flash('error', 'Password reset failed. Try again.');
    res.redirect('/reset-password');
  }
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
  if (req.body.username) updates.username = req.body.username.trim();
  if (req.body.phone) updates.phone = req.body.phone.trim();
  if (req.body.route) updates.route = req.body.route.trim();
  if (req.file) updates.photo = req.file.filename;

  try{
    // Check for conflicts with other users
    const conflictQuery = {
      _id: { $ne: req.user._id },
      $or: []
    };

    if (updates.username) {
      conflictQuery.$or.push({ username: updates.username });
    }
    if (updates.phone) {
      conflictQuery.$or.push({ phone: updates.phone });
    }
    if (updates.route) {
      conflictQuery.$or.push({ route: updates.route });
    }

    if (conflictQuery.$or.length > 0) {
      const conflict = await userModel.findOne(conflictQuery);
      if (conflict) {
        req.flash('error', '❌ One or more fields already exist for another user.');
        // If using flash messages, redirect to the profile page
        return res.redirect('/profile');
      }
    }
    await userModel.findByIdAndUpdate(req.user._id, updates);
    res.redirect('/profile');
  } catch (err) {
    console.error("❌ Profile update failed:", err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/profile');
  }

  

 

});

// Route for owner profile update
router.post("/update-owner-profile", isLoggedIn, upload.single('photo'), async function(req, res) {
  const updates = {};

  if (req.body.ownername) updates.ownername = req.body.ownername.trim();
  if (req.body.phone) updates.phone = req.body.phone.trim();
  if (req.body.email) updates.email = req.body.email.trim();
  if (req.file) updates.photo = req.file.filename;

  try {
    const conflictQuery = {
      _id: { $ne: req.user._id },
      $or: []
    };

    if (updates.ownername) {
      conflictQuery.$or.push({ ownername: updates.ownername });
    }
    if (updates.phone) {
      conflictQuery.$or.push({ phone: updates.phone });
    }
    if (updates.email) {
      conflictQuery.$or.push({ email: updates.email });
    }

    if (conflictQuery.$or.length > 0) {
      const conflict = await ownerModel.findOne(conflictQuery);
      if (conflict) {
        req.flash('error', '❌ One or more fields already exist for another owner.');
        return res.redirect('/ownerprofile');
      }
    }

    await ownerModel.findByIdAndUpdate(req.user._id, updates);
    req.flash('success', '✅ Profile updated successfully!');
    res.redirect('/ownerprofile');
  } catch (err) {
    console.error("❌ Profile update failed:", err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/ownerprofile');
  }
});

module.exports = router;
