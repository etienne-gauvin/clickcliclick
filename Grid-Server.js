/**
 * Créer une grille de jeu
 * @param (number) number_of_players
 */
var Grid = function(game, number_of_players)
{
  this.game = game;
  this.size = 20;
  
  this.catchInDiagonal = true;
  this.catchInHV = true;
  
  
  if (number_of_players <= 4) {
    this.size = number_of_players * 4;
  }
  
  console.log("new grid of size = " + this.size, number_of_players);
  
  this.points = [];
  
  for (var x=0 ; x<this.size ; x++) {
    this.points[x] = [];
    for (var y=0 ; y<this.size ; y++)
      this.points[x][y] = false;
  }
}

/**
 * Clic d'un joueur
 * @param (Socket) socket
 */
Grid.prototype.handleClientClick = function(x, y, player)
{
  console.log("a player clicked " + x + "," + y + " (/" + this.game.name + ")");
  
  if (this.game.state == 'playing' && this.game.countdown > 0)
  {
    this.points[x][y] = player.name;
    
    server.nsp.in(this.game.name).emit('click', {
      player: player,
      x: x,
      y: y
    });
    
    // Les points situés entre celui et un autre de la même couleur
    // sur une diagonale, une ligne ou une colonne
    // prennent la même couleur
    
    var found = false;
    
    for (var xi=-1 ; xi <= 1 ; xi++)
    {
      for (var yi=-1 ; yi <= 1 ; yi++)
      {
        found = false;
        
        if (
          (this.catchInHV && (xi!=0 ^ yi!=0)) ||
          (this.catchInDiagonal && xi!=0 && yi!=0)
        )
        {
          for (var xn=x+xi, yn=y+yi ;
            (xi==0 || x!=xn) && (yi==0 || y!=yn) && xn>=0 && yn>=0 && xn<this.size && yn<this.size ;
            xn += (found?-xi:xi), yn += (found?-yi:yi))
          {
            if (!found && this.points[xn][yn] == false)
              break;
            
            else if (!found && this.points[xn][yn] == player.name)
              found = true;
            
            else if (found)
              this.points[xn][yn] = player.name;
          }
        }
      }
    }
    
    this.sendGridUpdate();
  }
}

/**
 * Envoyer une mise à jour de la grille à une ou toutes les sockets
 * @param (Socket) [socket]
 */
Grid.prototype.sendGridUpdate = function(socket)
{
  var data = { points: this.points };
  
  console.log("sent grid update to " + (typeof socket !== 'undefined' ? socket.id : "all"));
  
  if (socket)
    socket.emit('update grid', data);
  else
    server.nsp.in(this.game.name).emit('update grid', data);
}

module.exports = Grid;
