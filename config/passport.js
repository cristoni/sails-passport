/**
 * Passport configuration file where you should configure strategies
 */

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
//var JwtStrategy = require('passport-jwt').Strategy;
var bcrypt = require('bcrypt-nodejs');
var randomstring = require("randomstring");
var _ = require('lodash');

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.find({username:username}).exec(function(err, user) {

            if (err) {
                return done(null, err);
            }
            if (!user || user.length < 1) {
                return done(null, false, {
                    message: 'Incorrect User'
                });
            }

            bcrypt.compare(password, user[0].password, function(err, res) {
                if (err || !res) {
                    return done(null, false, {
                        message: 'Invalid Password'
                    });
                } else {
                    return done(null,user);
                }
            });
        });
    })
);

passport.use(new GoogleStrategy({
        clientID: '620527013823-qv9cerqao5u1ij3arl1ongeta2b6oaks.apps.googleusercontent.com',
        clientSecret: 'aBP1EQjfIO-cQuBEA0234WDY',
        callbackURL: "http://aemporium.com:1337/auth/google/callback",
        scope: 'profile email'
    },
    function (accessToken, refreshToken, profile, done) {
        var username = _.chain(profile.emails)
            .find('type', 'account')
            .get('value')
            .value();
        
        User.find({username:username}).exec(function(err, user) {

            if (err || !user || user.length < 1) {
                var password = randomstring.generate({
                    length: 12,
                    charset: 'alphabetic'
                });

                var newUser = {
                    username: username,
                    email: username,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    displayName: profile.displayName,
                    photo: profile.photos[0].value.split("?")[0],
                    provider: 'google',
                    password: password
                };

                User.create(newUser)
                    .exec( function( err, user ){
                        if (err) {
                            return done(null, err);
                        } else {
                            // transporter.sendMail({
                            //   from: 'Æmporium <info@aemporium.net>',
                            //   to: user.email,
                            //   subject: 'Registrazione effettuata con successo',
                            //   text: 'Grazie di esserti registrato e benvenuto su Æmporium.net. La tua password è: ' + _password,
                            //   html: '<p>Grazie di esserti registrato e <b>benvenuto</b> su Æmporium.net.<br /><br /><a href="aemporium.net">Inizia subito a navigare tra gli annunci di tuo interesse!</a><br /><br />La tua password è: <i>'+ _password +'</i></p>',
                            // }, function(err, info) {
                            //   if(err) return err;

                            //   return info;
                            // });

                            return done(null, user);
                        }
                    });
            } else {
                return done(null, user);
            }
        });
    })
);

module.exports = {
    http: {
        customMiddleware: function(app) {
            app.use(passport.initialize());
            app.use(passport.session());
        }
    }
};