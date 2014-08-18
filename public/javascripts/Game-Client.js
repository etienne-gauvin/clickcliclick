var Game = function()
{
  // ID du jeu
  this.name = window.location.pathname.substring(window.location.pathname.search('[^/]+$'));
  this.playerid = false;
  
  // État actuel du jeu
  this.state = 'waiting for connection';
  this.online = false;
  
  // "Calques"
  this.grid_g = snap.g().addClass("grid");
  this.hud_g = snap.g().addClass("hud");
  
  // Grille
  this.grid = false;
  
  // Joueurs
  this.players = {};
  
  // Gestionnaire de la connexion
  this.socket = io('/games');
  var socket = this.socket;
  
  socket.on('connect', function() {
    console.log("connected to server");
    game.online = true;
    socket.emit('join game', { gamename: game.name });
  });
  
  socket.on('disconnect', function() {
    game.online = false;
    alert("Vous avez été déconnecté.");
  });
  
  socket.on('error', function() {
    game.online = false;
    alert("Une erreur est survenue, merci de recharger la page.");
  });
  
  // Écouteurs
  
  // Définir l'ID du joueur actuel
  socket.on('id', function(data) {
    game.playerid = data.id;
  });
  
  // Réception d'un clic
  socket.on('click', function(data) {
    //console.log("received click from " + data.name + " on " + data.x + "," + data.y);
    game.grid.setPointOwner(data.x, data.y, data.player);
  });
  
  // Mise à jour de la liste des joueurs
  socket.on('update players', function(data) {
    //console.log("received players update");
    game.handlePlayersUpdate(data);
  });
  
  // Mise à jour de la grille
  socket.on('update grid', function(data) {
    console.log("received grid update");
    
    if (!game.grid) {
      game.grid = new Grid(data.points);
      game.grid_g.animate({opacity: 1}, 150);
    }
    else
      game.grid.handleGridUpdate(data);
  });
  
  // Mise à jour du compte à rebours
  socket.on('update state', function(data) {
    //console.log("received state update");
    game.handleStateUpdate(data);
  });
}

/**
 * Mise à jour de la liste des joueurs
 * @param (object) data { players: { [name]: { name, color, score } } }
 */
Game.prototype.handlePlayersUpdate = function(data) {
  game.players = data.players;
  
  if (game.playerid)
    hud.updateFrame(game.players[game.playerid].color);
}

/**
 * Mise à jour de l'affichage de l'état du jeu
 */
Game.prototype.handleStateUpdate = function(data)
{
  if (data.state == 'waiting for start') {
    hud.updateStartCountdown(data.countdown);
  }
  
  else if (data.state == 'playing' && data.countdown == 0) {
    hud.gameOver();
  }
  
  this.state = data.state;
  this.countdown = data.countdown;
  hud.updateState();
  
  // Début du compte à rebours pour la prochaine manche
  if (this.state == "waiting for start" && this.countdown <= 5 && this.countdown > 0)
  {
    game.grid_g.clear();
    game.grid = false;
    hud.scoreboard_g.animate({opacity: 0}, 150);
    
    for (var i in this.players)
      this.players[i].score = 0;
  }
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


