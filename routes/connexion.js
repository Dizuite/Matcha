var express = require('express');
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/Matcha";
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var session = require('express-session');

var app = express();
var router = express.Router();

router.post('/', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
	mongo.connect(url, function(err, db) {
    if (req.body.login == "" || req.body.pass == "") {
      console.log("ERREUR");
      ret.res = "Formulaire incomplet";
      res.status(200).send(JSON.stringify(ret));
      db.close();
    }
    else {
      req.body.pass = crypto.createHash('whirlpool').update(req.body.pass).digest('hex');
  		db.collection("users").findOne({email: req.body.login, pass: req.body.pass}, function(err, result){
  			if (result == null) {
          console.log("ERREUR");
          ret.res = "Entrées incorrectes";
          res.status(200).send(JSON.stringify(ret));
          db.close();
        }
        else {
          if (result.verif == "non") {
            console.log("ERREUR");
            ret.res = "Courriel non vérifié";
            res.status(200).send(JSON.stringify(ret));
            db.close();
          }
          else {
            req.session.secret = req.body.login;
            ret.status = true;
            ret.res = "ok";
            res.status(200).send(JSON.stringify(ret));
            db.close();
          }
        }
  		});
    }
	})
});

router.post('/mp_oublie', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  hmp = crypto.createHash('whirlpool').update(req.body.new_pass).digest('hex');
  mongo.connect(url, function(err, db) {
    db.collection("users").findOne({email: req.body.email}, function(err, result){
      if (result != null && result.verif == 'non') {
        console.log("Compte non vérifié");
        ret.res = "Compte non vérifié";
        res.status(200).send(JSON.stringify(ret));
        db.close();
      }
      else if (result != null && result.verif == 'oui') {
        let d = new Date();
        let n = d.getTime();
        let string = crypto.createHash('md5').update(req.body.email).digest('hex') + n + crypto.createHash('md5').update(result.nom).digest('hex') + crypto.createHash('md5').update(result.prenom).digest('hex');
        let user_token = {
          token: crypto.createHash('md5').update(string).digest('hex'),
          user: req.body.email
        };
        db.collection("token").insertOne(user_token, function(err, result){
          console.log('token inserted');
        });
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'matcha.cmarin@gmail.com',
            pass: 'Terchy_Bay'
          }
        });
        var mailOptions = {
          from: 'matcha.cmarin@gmail.com',
          to: req.body.email,
          subject: 'Changement de mot de passe',
          text: 'Salutations ' + result.prenom + ', cliquez sur ce lien pour changer votre mot de passe : \n\n http://localhost:3000/connexion/mp_oublie/' + user_token.token + '/' + hmp,
          };
          transporter.sendMail(mailOptions, function(error, info){
             if(error){
                return console.log(error);
             }
             console.log('Message sent: ' + info.response);
          });
          transporter.close();
          ret.status = true;
          ret.res = "ok";
          res.status(200).send(JSON.stringify(ret));
          db.close();
      }
      else {
        console.log("Compte inexistant");
        ret.res = "Compte inexistant";
        res.status(200).send(JSON.stringify(ret));
        db.close();
      }
    });
  });
});

router.get('/mp_oublie/:cle/:hmp', function(req, res) {
  var token_user = req.params.cle;
	var new_mp = req.params.hmp;

	mongo.connect(url, function(err, db) {
		db.collection("token").findOne({token: token_user}, function(err, result) {
			if (result == undefined) {
				db.close();
				res.redirect('/P3bvT');
			}
			else {
				var user = result.user;
				db.collection("users").update({email: result.user}, {$set : {pass: new_mp}}, function(err, result) {
					if (err) {
						console.log(err);
					}
				});
				db.collection("token").drop({token: token_user}, function(err, result) {
					if (err) {
						console.log(err);
					}
				});
				db.close();
				res.redirect('/P3bvP');
			}
		});
	});
});

module.exports = router;
