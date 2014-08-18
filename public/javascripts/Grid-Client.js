var Grid = function(points)
{
  this.size = points.length;
  
  // Élément conteneur des points
  this.points_g = snap.group()
    .appendTo(game.grid_g);
  
  // Liste des <circle>
  this.points_circles = [];
  this.initGrid(points);
  
  // Rotation de la grille
  /*var bbox = this.points_g.getBBox();
  console.log(bbox);
  Snap.animate(0, 1, function(n)
  {
    game.grid.points_g.attr('transform', 
      //"translate(" + bbox.width/2 + " " + bbox.height/2 + ") "+
      "rotate(" + n*360 + " " + bbox.width/2 + " " + bbox.height/2 + ")");
  }, 10000);*/
}

/**
 * Modifier le propriétaire d'un point
 */
Grid.prototype.setPointOwner = function(x, y, player)
{
  if (typeof player !== 'undefined')
  {
    var circle = this.points_circles[x][y].data('owner', player.name);
    
    Snap.animate(20, 50, function (n) {
      circle.attr({
        fill: Snap.hsl(player.color, 100, 100 * (1 - n / 100)),
        stroke: Snap.hsl(player.color, 100, 60 * (1 - n / 100)),
        strokeWidth: (-(n - 50) / 30 * 4) + "px"
      });
      
    }, 300, mina.easeout);
    
    this.points_circles[x][y]
      .data('owner', player.name);
  }
  else
  {
    this.points_circles[x][y]
      .data('owner', false)
      .animate({fill: "#DDD"}, 300, mina.easeout);
  }
}

/**
 * Initialise la zone de jeu
 */
Grid.prototype.initGrid = function(points)
{ 
  // On efface les éléments présents
  this.points_g.clear();
  
  // Pour centrer la grille
  var x0 = svgWidth/2 - this.size * 32/2 + 16, y0 = svgHeight/2 - this.size * 32/2 + 16;
  
  // Remplissage de la grille
  for (var x=0 ; x < this.size ; x++)
  {
    this.points_circles[x] = [];
    
    for (var y=0 ; y < this.size ; y++)
    {
      var c = snap.circle(x0 + x * 32, y0 + y * 32, 14);
      this.points_g.add(c);
      
      this.points_circles[x][y] = c;
      
      c.data('x', x);
      c.data('y', y);
      
      if (points[x][y] && typeof game.players[points[x][y]] !== 'undefined')
        this.setPointOwner(x, y, game.players[points[x][y]]);
      else
        this.setPointOwner(x, y);
      
      c.click(function() {
        game.socket.emit('click', { x: this.data('x'), y: this.data('y') });
      });
      
    }
  }
}

/**
 * Met à jour les points
 */
Grid.prototype.handleGridUpdate = function(data)
{
  for (var x=0 ; x < this.size ; x++)
  {
    for (var y=0 ; y < this.size ; y++)
    {
      if (data.points[x][y] !== this.points_circles[x][y].data('owner'))
      {
        if (typeof game.players[data.points[x][y]] !== 'undefined')
          this.setPointOwner(x, y, game.players[data.points[x][y]]);
        else
          this.setPointOwner(x, y);
      }
    }
  }
}

/**
 * Chercher et placer dans le tableau des scores chaque point récursivement
 */
Grid.prototype.searchScores = function(x, y, scorePositions)
{
  console.log(pts, x, y);
  
  var pts = this.points_circles,
      grid = this,
      playerid = pts[x][y].data("owner");
  
  if (pts[x][y].data("owner") !== false)
  {
    game.players[playerid].score++;
    hud.updateScore(playerid);
    
    pts[x][y].appendTo(this.points_g).animate(
      {
        cx: scorePositions[playerid].x,
        cy: scorePositions[playerid].y
      }, 150, mina.easein,
      function()
      {
        if (game.players[playerid].score > 1)
          pts[x][y].attr("visibility", "hidden");
        
        
        if (x+1 >= pts.length)
          if (y+1 >= pts[0].length)
            return;
          else
            grid.searchScores(0, y+1, scorePositions);
        
        else
          grid.searchScores(x+1, y, scorePositions);
      }
    );
    
    pn = 0;
  }
  else
  {
    pts[x][y].animate({opacity: 0}, 20, function()
    {
      if (x+1 >= pts.length)
        if (y+1 >= pts[0].length)
          return;
        else
          grid.searchScores(0, y+1, scorePositions);
      
      else
        grid.searchScores(x+1, y, scorePositions);
    });
  }
}

