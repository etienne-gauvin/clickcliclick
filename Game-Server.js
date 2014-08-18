var Grid = require("./Grid-Server");

/**
 * Jeu
 * @param Socket
 */
var Game = function(name)
{
  this.name = name;
  
  // Durée d'une manche
  this.duration = 60;
  
  // Liste des joueurs
  // { [name]: { name, color, score } }
  this.players = {};
  
  // Couleur attribuée aux nouveaux joueurs
  this.previousColor = 0;
  
  // État actuel du jeu
  // waiting for players | waiting for start | playing
  this.state = 'waiting for players';
  
  // Compteur avant le début ou la fin de la manche
  this.countdown = false;
  this.countdownStarted = false;
  
  // Grille
  this.grid = false;
  
  // Fonction de mise à jour du compte à rebours
  var game = this;
  this.countdownFID = setInterval(function()
  {
    if (game.countdown > 0)
    {
      game.countdown -= 1;
      game.sendStateUpdate();
    
      if (game.countdown <= 0)
        game.updateState();
    }
  }, 1000);
  
  console.log("a new game has been created (/" + this.name + ")");
}

/**
 * Réception d'un nouveau joueur
 * @param (Socket) socket
 */
Game.prototype.handleClientClick = function(socket, data)
{
  this.grid.handleClientClick(data.x, data.y, this.players[socket.id]);
}

/**
 * Réception d'un nouveau joueur
 * @param (Socket) socket
 */
Game.prototype.addPlayer = function(socket)
{
  console.log("a player joined the game (/" + this.name + ")");
  
  socket.join(this.name);
  this.players[socket.id] = socket.data;
  
  socket.data.name = socket.id;
  socket.data.color = (this.previousColor += Math.floor(Math.random()*30) + 30);
  socket.data.score = 0;
  
  socket.emit('id', {id: socket.id});
  this.sendPlayersUpdate();
  
  if (this.state == 'playing')
    this.grid.sendGridUpdate(socket);
  
  this.updateState();
}


/**
 * Un joueur quitte le jeu
 * @param (Socket) socket
 */
Game.prototype.handleDisconnect = function(socket)
{
  console.log("a player quit the game (/" + this.name + ")");
  this.players[socket.id] = undefined;
  
  if (this.countPlayers() == 0)
  {
    clearInterval(this.countdownFID);
    server.removeGame(this);
    console.log("a game has been removed (/" + this.name + ")");
  }
  else
  {
    this.sendPlayersUpdate();
    
    if (this.grid)
      this.grid.sendGridUpdate();

    this.updateState();
  }
}

/**
 * Envoyer une mise à jour de la liste des joueurs
 */
Game.prototype.sendPlayersUpdate = function()
{
  server.nsp.in(this.name).emit('update players', {
    players: this.players
  });
}

/**
 * Déterminer si il faut lancer le jeu / arrêter / etc
 */
Game.prototype.updateState = function()
{
  // Il faut au moins 2 personnes pour démarrer
  if (this.countPlayers() <= 1)
  {
    this.state = 'waiting for players';
    this.countdown = false;
    
    this.sendStateUpdate();
  }
  else
  {
    // Le jeu peut commencer
    if (this.state == 'waiting for players')
    {
      // Démarrage du jeu
      this.state = 'waiting for start';
      this.countdown = 5;
      
      this.sendStateUpdate();
      this.updateState();
    }
    
    // Le compte à rebours du départ a commencé
    else if (this.state == 'waiting for start')
    {
      // Fin du compte à rebours
      // & début de la manche
      if (this.countdown <= 0)
      {
        // Démarrage du jeu
        this.state = 'playing';
        this.countdown = this.duration;
        
        this.grid = new Grid(this, this.countPlayers());
        this.grid.sendGridUpdate();
        
        this.sendStateUpdate();
        this.updateState();
      }
    }
    
    // Compte à rebours de la fin du jeu
    else if (this.state == 'playing')
    {
      // Fin du compte à rebours
      // & fin de la manche
      if (this.countdown <= 0)
      {
        this.state = 'waiting for start';
        this.countdown = 20;

        this.sendStateUpdate();
        this.updateState();
      }
    }
  }
}


/**
 * Mettre à jour l'état du jeu
 */
Game.prototype.sendStateUpdate = function()
{
  console.log("game is now " + this.state + " (countdown=" + (this.countdown!==false?this.countdown:'false')+')');
  
  server.nsp.in(this.name).emit('update state', {
    state: this.state,
    countdown: this.countdown
  });
}

/**
 * Compter le nombre de joueurs
 */
Game.prototype.countPlayers = function()
{
  var playersNumber = 0;
  
  for (var i in this.players)
    if (this.players[i])
      playersNumber++;
  
  return playersNumber;
}


module.exports = Game;
