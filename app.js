var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressSession = require('express-session');
var flash = require('connect-flash');

var passport = require('passport');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var ownerModel = require('./routes/owner');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret:"hello hello baaye baaye"
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());



// Passport serialization and deserialization for multiple entities Authentication setup
passport.serializeUser((user, done) => {
  // Tag user type to identify during deserialization
  const type = user instanceof usersRouter ? 'User' : 'Owner';
  done(null, { id: user.id, type });
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === 'User') {
      const user = await usersRouter.findById(obj.id);
      done(null, user);
    } else if (obj.type === 'Owner') {
      const owner = await ownerModel.findById(obj.id);
      done(null, owner);
    } else {
      done(new Error('Unknown user type'));
    }
  } catch (err) {
    done(err);
  }
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
