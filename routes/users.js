var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: './uploads'});
var User = require('../models/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');
var async = require('async');
var crypto =require('crypto');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register',{ title: 'Register' });
});

router.get('/login', function(req, res, next) {
  res.render('login',{ title: 'Login' });
});


router.post('/login',
	passport.authenticate('local',{failureRedirect : '/users/login', failureFlash: 'Invalid username or password '}),
	function(req, res){
		req.flash('success', 'You are now logged in');
		res.redirect('/');
	});

passport.serializeUser(function(user, done){
	done(null, user.id);
});

passport.deserializeUser(function(id, done){
	User.getUserById(id, function(err,user){
		done(err, user);
	});
	
});


passport.use(new LocalStrategy(function(username, password, done){
	User.getUserByUsername(username, function(err, user){
		if(err) throw err;
		if(!user){
			return done(null, false, {message: 'Unknown User'});
		}

		User.comparePassword(password, user.password, function(err, isMatch){
			if(err) return done(err);
			if(isMatch){
				return done(null, user);
			}else{
				return done(null, false,{message: 'Invalid Password'});
			}
		});
	});
}));


router.post('/register',upload.single('profileimage'), function(req, res, next) {
 
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

   if(req.file){
   	console.log('uploading file...');
   	var profileimage = req.file.filename;
   }else{
   	console.log('No file uploaded');
   	var profileimage = 'noimage.jpg';
   }

   // form validator 

   req.checkBody('name','Name field is required').notEmpty();
   req.checkBody('email','Email field is required').notEmpty();
   req.checkBody('email','Email is not valid').isEmail();
   req.checkBody('username','Username field is required').notEmpty();
   req.checkBody('password',' Password field is required').notEmpty();
   req.checkBody('password2','password do not match').equals(req.body.password);

   // check errors

   var errors = req.validationErrors();

   if(errors){
   	res.render('register',{
   		errors: errors
   	});

   }else{
   	var newUser = new User({
   		name: name,
   		email: email,
   		username: username,
   		password: password,
   		profileimage: profileimage
   	});

   	User.createUser(newUser, function(err, user){
   		if(err) throw err;
   		console.log(user);

   		req.flash('success', 'you are now registered and can login');

   		res.location('/');
   		res.redirect('/');
   	});
   }


});


router.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'you are now logged out');
	res.redirect('/users/login');
});



router.get('/forgot', function(req, res) {
  res.render('forgot');
});


router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport( {
        service: 'Gmail',
        auth: {
          user: 'xxxxxxxx@gmail.com',
          pass: '!!!put your password here!!!'    
        // password is not correct put your own details

        }
      });
      var mailOptions = {
        to: user.email,
        from: 'xxxxxxxxx@gmail.com',
        // your email here on top!!!!
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});


module.exports = router;
