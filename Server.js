var Game = require('./Game-Server');

var Server = function(io)
{
  this.nsp = io.of('/games');
  this.games = {};
  this.sockets = {};
  
  var server = this;
  
  this.nsp.on('connection', function(socket)
  {
    server.handleNewConnection(socket);
    
    socket.on('join game', function(data) {
      server.handleJoinGameRequest(socket, data);
    });
    
    socket.on('click', function(data) {
      server.handleClientClick(socket, data);
    });
    
    socket.on('disconnect', function() {
      server.handleDisconnect(socket);
    });
  });
}

/**
 * Ouverture d'une nouvelle connexion
 * @param (Socket) socket
 */
Server.prototype.handleNewConnection = function(socket) {
  console.log("a user connected (" + socket.id + ")");
  this.sockets[socket.id] = socket;
  socket.data = {};
}

/**
 * Fermeture d'une connexion
 * @param (Socket) socket
 */
Server.prototype.handleDisconnect = function(socket)
{
  console.log("a user disconnected (" + socket.id + ")");
  
  for (var i=0 ; i<socket.rooms.length ; i++)
  {
    if (this.gameExists(socket.rooms[i]))
      this.games[socket.rooms[i]].handleDisconnect(socket);
  }
  
  this.sockets[socket.id] = undefined;
}

/**
 * Un joueur demande à rejoindre un jeu
 */
Server.prototype.handleJoinGameRequest = function(socket, data)
{
  if (this.gameExists(data.gamename))
    this.games[data.gamename].addPlayer(socket);
}

/**
 * Un joueur a effectué un clic
 */
Server.prototype.handleClientClick = function(socket, data)
{
  var game = this.getGame(socket);
  
  if (typeof data.x === 'number' && typeof data.y === 'number')
    game.handleClientClick(socket, data);
}

/**
 * Vérifie qu'un jeu existe
 * @param (string) name
 * @return boolean
 */
Server.prototype.gameExists = function(name) {
  return (typeof name === 'string' && name.length > 0 && typeof this.games[name] === 'object');
}

/**
 * Retourne un nouveau jeu
 * @param (String) name
 * @return Game
 */
Server.prototype.newGame = function(name)
{
  this.games[name] = new Game(name);
}

/**
 * Retire un jeu
 * @param (Game) game
 */
Server.prototype.removeGame = function(game)
{
  delete this.games[game.name];
}

/**
 * Retourne le jeu auquel appartient le joueur
 * @return Game
 */
Server.prototype.getGame = function(socket)
{
  for (var i=0 ; i<socket.rooms.length ; i++)
    if (this.gameExists(socket.rooms[i]))
      return this.games[socket.rooms[i]];
}

/**
 * Retourne un mot aléatoire de 6 lettres
 * @return String
 */
Server.prototype.getRandomGameName = function()
{
  var c = "bcdfghjklmnpqrstvwxz",
      v = "aeiouy",
      mot = "";
  
  for (var i=0 ; i<3 ; i++)
    mot += (c+v)[Math.floor(Math.random()*26)] + v[Math.floor(Math.random()*6)];
  
  return mot;
}

module.exports = function(io) {
  return new Server(io);
}
