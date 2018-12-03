var express = require('express');
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/Matcha";
var crypto = require('crypto');
var nodemailer = require('nodemailer');

var app = express();
var router = express.Router();

router.post('/', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	let ret = {
		status: false,
		res: "erreur",
	};
	let items = {
		prenom: req.body.prenom,
		nom: req.body.nom,
		email: req.body.email,
		pass: req.body.mp,
		dtn: req.body.date_naissance,
		sexe: req.body.sexe,
    verif: 'non',
		photo_profil: 'user_pic_default',
		interesse_par: 'homme_et_femme',
		localisation: 'Monde',
		biographie: '',
		tag: '',
		d_likes: '',
		d_consult: ''
  };
	mongo.connect(url, function(err, db) {
    var ojd = new Date();
    var ojdForma = {
      dd : 00,
      mm : (ojd.getMonth() + 1),
      aa : (ojd.getYear() + 1900),
      date : 0,
      dlimit : 0
    };
    ojd.getDate().length == 2 ? ojdForma.dd = ojd.getDate() : ojdForma.dd = '0' + ojd.getDate();
    ojdForma.mm.length == 2 ? ojdForma.mm = ojdForma.mm : ojdForma.mm = '0' + ojdForma.mm;
    ojdForma.date = ojdForma.dd + '/' + ojdForma.mm + '/' + ojdForma.aa;
    ojdForma.dlimit = ojdForma.dd + '/' + ojdForma.mm + '/' + (ojdForma.aa - 18);
		let n = {
			d : parseInt(items.dtn.split('/')[0]),
			m : parseInt(items.dtn.split('/')[1]),
			y : parseInt(items.dtn.split('/')[2])
		};
		let a = {
			d : parseInt(ojdForma.date.split('/')[0]),
			m : parseInt(ojdForma.date.split('/')[1]),
			y : parseInt(ojdForma.date.split('/')[2])
		}
		let l = {
			d : parseInt(ojdForma.dlimit.split('/')[0]),
			m : parseInt(ojdForma.dlimit.split('/')[1]),
			y : parseInt(ojdForma.dlimit.split('/')[2])
		}
		if (req.body.prenom == "" || req.body.nom == "" || req.body.email == "" ||
			req.body.mp == "" || req.body.date_naissance == "" || req.body.sexe == "") {
			console.log("ERREUR");
			ret.res = "Formulaire incomplet";
      res.status(200).send(JSON.stringify(ret));
      db.close();
		}
    else if (!items.pass.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
      console.log("BadMp");
      ret.res = "Mot de passe pas assez complexe";
      res.status(200).send(JSON.stringify(ret));
      db.close();
    }
    else if (a.y < n.y
    || (a.y == n.y && a.m < n.m)
    || (a.y == n.y && a.m == n.m
    && a.d < n.d)) {
      console.log("Mauvaise date");
      ret.res = "Mauvaise date";
      res.status(200).send(JSON.stringify(ret));
      db.close();
    }
		else if (n.y < 1900) {
			console.log("Trop vieux");
			ret.res = "wtf comment t'es vieux t'es un alien";
			res.status(200).send(JSON.stringify(ret));
			db.close();
		}
    else if (l.y < n.y
    || (l.y == n.y && l.m < n.m)
    || (l.y == n.y && l.m == n.m
    && l.d < n.d)) {
      console.log("Trop jeune");
      ret.res = "Trop jeune";
      res.status(200).send(JSON.stringify(ret));
      db.close();
    }
    else {
      items.pass = crypto.createHash('whirlpool').update(items.pass).digest('hex');
      db.collection("users").findOne({email: req.body.email}, function(err, result){
        if (result == null) {
					let d = new Date();
					let n = d.getTime();
					let string = crypto.createHash('md5').update(req.body.email).digest('hex') + n + crypto.createHash('md5').update(req.body.nom).digest('hex') + crypto.createHash('md5').update(req.body.prenom).digest('hex');
					let user_token = {
						token: crypto.createHash('md5').update(string).digest('hex'),
						user: req.body.email
					};
					db.collection("token").insertOne(user_token, function(err, result){
						console.log('token inserted');
					});
          db.collection("users").insertOne(items, function(err, result){
						var transporter = nodemailer.createTransport({
							service: 'gmail',
							auth: {
								user: 'matcha.cmarin@gmail.com',
								pass: 'Terchy_Bay'
							}
						});
						var mailOptions = {
							from: 'matcha.cmarin@gmail.com',
							to: items.email,
							subject: 'Bienvenue sur Matcha',
							text: 'Bienvenue sur Matcha ' + items.prenom + ', veuillez confirmer votre inscription sur ce lien : \n\n http://localhost:3000/inscription/validation/' + user_token.token,
							// html: '<b>' + req.body.message + '</b>'
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
          });
        }
        else {
          console.log("email déjà utilisé");
          ret.res = "Email déjà utilisé";
          res.status(200).send(JSON.stringify(ret));
          db.close();
        }
      });
    }
	})
})

router.get('/validation/:cle', function(req, res) {
	var token_user = req.params.cle;

	mongo.connect(url, function(err, db) {
		db.collection("token").findOne({token: token_user}, function(err, result) {
			if (result == undefined) {
				db.close();
				res.redirect('/P3bvT');
			}
			else {
				var user = result.user;

				db.collection("users").update({email: result.user}, {$set : {verif: 'oui'}}, function(err, result) {
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
				res.redirect('/P3bvD');
			}
		});
	});
});

module.exports = router;
