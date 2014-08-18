#!/usr/bin/node

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = global.io = require('socket.io')(http);
var fs = require('fs');

var server = global.server = require('./Server')(io);

// Fichiers statiques
app.use(express.static(__dirname + '/public'));

// Vues
app.engine('handlebars', require('consolidate').handlebars);
app.set('view engine', 'handlebars');

// Rediriger vers un plateau
app.get('/games/new', function(req, res)
{
  do {
    var gamename = server.getRandomGameName();
  }
  while (typeof server.games[gamename] !== 'undefined')
  
  res.redirect('/games/' + gamename);
});

// Afficher un plateau
app.get('/games/:gamename', function(req, res)
{
  var gamename = req.params.gamename;
  
  if (typeof server.games[gamename] === 'undefined') {
    server.newGame(gamename);
  }
  
  res.render('main', { game: server.games[gamename] });
});

// Afficher un plateau
app.get('/', function(req, res)
{
  res.render('games', {
    games: server.games
  });
});

// Ouverture du serveur
http.listen(3000, function() {
  console.log('listening on *:3000');
});

// Helper pour compter le nombre de joueurs
require('handlebars').registerHelper("countPlayers", function(game) {
  return game.countPlayers();
});
