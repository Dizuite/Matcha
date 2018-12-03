var express = require('express');
var bodyParser = require('body-parser');
var mongo = require('mongodb').MongoClient;
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var session = require('express-session');

var url = "mongodb://localhost:27017/Matcha";
var app = express();
var router = express.Router();

router.post('/', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  var info = {
    login: 'visiteur',
    nom: '',
    prenom: '',
    age: '',
    sexe: '',
    photo_profil: '',
    interesse_par: '',
    localisation: '',
    biographie: '',
    tag: '',
    d_likes: '',
    d_consult: ''
  };
  if (req.session.secret) {
    info.login = req.session.secret;
    mongo.connect(url, function(err, db) {
      db.collection("users").findOne({email: info.login}, function(err, result){
        info.prenom = result.prenom;
        info.nom = result.nom;
        info.sexe = result.sexe;
        info.photo_profil = result.photo_profil;
        info.interesse_par = result.interesse_par;
        info.localisation = result.localisation;
        info.biographie = result.biographie;
        info.tag = result.tag;
        info.d_likes = result.d_likes;
        info.d_consult = result.d_consult;
        info.age = '0';
        d = new Date();
        let year = d.getYear() + 1900;
        let month = d.getMonth() + 1;
        let day = d.getDate();
        let yb = result.dtn.split('/')[2];
        while (yb < year) {
          if (yb == year - 1) {
            if (result.dtn.split('/')[1] < month) {
              yb++;
              info.age++;
            }
            else if (result.dtn.split('/')[1] == month) {
              if (result.dtn.split('/')[0] < day) {
                yb++;
                info.age++;
              }
              else if (result.dtn.split('/')[0] == day) {
                // HAPPY BIRTHDAY
                yb++;
                info.age++;
              }
              else {
                yb++;
              }
            }
            else {
              yb++;
            }
          }
          else {
            yb++;
            info.age++;
          }
        }
        req.session.info = info;
        res.status(200).send(JSON.stringify(info));
      });
      db.close();
    });
  }
  else {
    res.status(200).send(JSON.stringify(info));
  }
});

router.post('/ch_prenom', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  mongo.connect(url, function(err, db) {
    db.collection("users").update({email: req.session.info.login}, {$set : {prenom: req.body.prenom}}, function(err, result) {
      ret.status = true;
      ret.res = 'ok';
      res.status(200).send(JSON.stringify(ret));
      db.close();
    });
  });
});

router.post('/ch_nom', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  mongo.connect(url, function(err, db) {
    db.collection("users").update({email: req.session.info.login}, {$set : {nom: req.body.nom}}, function(err, result) {
      ret.status = true;
      ret.res = 'ok';
      res.status(200).send(JSON.stringify(ret));
      db.close();
    });
  });
});



router.post('/ch_email', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  mongo.connect(url, function(err, db) {
    db.collection("users").findOne({email: req.body.email}, function(err, result){
      if (result == null) {
        let d = new Date();
        let n = d.getTime();
        let string = crypto.createHash('md5').update(req.body.email).digest('hex') + n + crypto.createHash('md5').update(req.body.email.split('@')[0]).digest('hex') + crypto.createHash('md5').update(req.body.email.split('@')[1]).digest('hex');
        let user_token = {
          token: crypto.createHash('md5').update(string).digest('hex'),
          user: req.body.email,
          old_email: req.session.info.login
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
          subject: "Matcha - Changement d'adresse email",
          text: 'Veuillez confirmer votre nouvelle adresse email en cliquant sur ce lien : \n\n http://localhost:3000/info/ch_email/' + user_token.token,
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
      }
      else {
        console.log("email déjà utilisé");
        ret.res = "Email déjà utilisé";
        res.status(200).send(JSON.stringify(ret));
        db.close();
      }
    });
  });
});

router.get('/ch_email/:cle', function(req, res) {
  var token_user = req.params.cle;
  mongo.connect(url, function(err, db) {
    db.collection("token").findOne({token: token_user}, function(err, result){
      if (result != undefined) {
        let new_email = result.user;
        let old_email = result.old_email;
        db.collection("users").update({email: old_email}, {$set : {email: new_email}}, function(err, result) {
          req.session.destroy();
          db.collection("token").drop({token: token_user}, function(err, result) {
            if (err) {
              console.log(err);
            }
          });
          // db.close();
          res.redirect('/P3bvC');
        });
      }
      else {
        db.close();
				res.redirect('/P3bvT');
      }
    });
  });
});

router.post('/ch_sexe', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let new_sexe;
  let ret = {
    status: false,
    res: "erreur",
  };
  req.session.info.sexe == 'Homme' ? new_sexe = 'Femme' : new_sexe = 'Homme';
  req.session.info.sexe = new_sexe;
  mongo.connect(url, function(err, db) {
    db.collection("users").update({email: req.session.info.login}, {$set : {sexe: new_sexe}}, function(err, result) {
      ret.status = true;
      ret.res = 'ok';
      res.status(200).send(JSON.stringify(ret));
      db.close();
    });
  });
});

router.post('/ch_interesse_par', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  let nvalue = req.body.interesse_par;
  mongo.connect(url, function(err, db) {
    db.collection("users").update({email: req.session.info.login}, {$set : {interesse_par: nvalue}}, function(err, result) {
      ret.status = true;
      ret.res = 'ok';
      res.status(200).send(JSON.stringify(ret));
      db.close();
    });
  });
});

router.post('/ch_txt_bio', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  mongo.connect(url, function(err, db) {
    db.collection("users").update({email: req.session.info.login}, {$set : {biographie: req.body.content}}, function(err, result) {
      ret.status = true;
      ret.res = 'ok';
      res.status(200).send(JSON.stringify(ret));
      db.close();
    });
  });
});

router.post('/ch_tags', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  mongo.connect(url, function(err, db) {
    db.collection("users").update({email: req.session.info.login}, {$set : {tag: req.body.content}}, function(err, result) {
      ret.status = true;
      ret.res = 'ok';
      res.status(200).send(JSON.stringify(ret));
      db.close();
    });
  });
});

router.post('/ch_localisation', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let ret = {
    status: false,
    res: "erreur",
  };
  mongo.connect(url, function(err, db) {
    db.collection("users").update({email: req.session.info.login}, {$set : {localisation: req.body.latitude + ";" + req.body.longitude}}, function(err, result) {
      ret.status = true;
      ret.res = 'ok';
      res.status(200).send(JSON.stringify(ret));
      db.close();
    });
  });
});

module.exports = router;
