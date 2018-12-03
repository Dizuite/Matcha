var express = require('express');
var bodyParser = require('body-parser');
var mongo = require('mongodb').MongoClient;
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var session = require('express-session');

var url = "mongodb://localhost:27017/Matcha";
var app = express();
var route = express.Router();

var route_connexion = require('./routes/connexion');
var route_inscription = require('./routes/inscription');
var route_info = require('./routes/info');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'none',
  resave: false,
  saveUninitialized: true,
  info: {
    login: 'visiteur',
    nom: '',
    prenom: '',
    age: '',
    sexe: ''
  }
}));

app.get('/', function(req, res) {
    res.render('index.ejs');
});
app.get('/P3bvD', function(req, res) {
  res.render('index.ejs');
});
app.get('/P3bvT', function(req, res) {
  res.render('index.ejs');
});
app.get('/P3bvP', function(req, res) {
  res.render('index.ejs');
});
app.get('/P3bvC', function(req, res) {
  res.render('index.ejs');
});
app.get('/mp_oublie', function(req, res) {
  res.render('index.ejs');
});

app.get('/profil', function(req, res) {
    res.render('profil.ejs');
});

app.get('/test', function(req, res) {
    res.render('test.ejs');
});

app.post('/deco', function(req, res) {
  let ret = {
    status: true,
    res: "deconnexion effectué",
  };
  req.session.secret = undefined;
  req.session.info = {
    login: 'visiteur',
    nom: '',
    prenom: '',
    age: '',
    sexe: ''
  }
  // res.render('index.ejs');
  res.status(200).send(JSON.stringify(ret));
});

app.use("/connexion", route_connexion);
app.use("/inscription", route_inscription);
app.use("/info", route_info);

app.use(function(req, res, next){
	res.setHeader('Content-Type', 'text/plain');
  res.status(404).send('Page introuvable');
});

app.listen(3000);
