var HUD = function()
{
  // Compte à rebours du départ
  this.center_text = snap.text(svgWidth/2, svgHeight/2)
    .addClass("start-countdown")
    .appendTo(game.hud_g);
  
  // Rectangle pour le flash
  this.flash_rect = snap.rect(0, 0, "100%", "100%")
    .attr("fill", "white")
    .attr("visibility", "hidden")
    .appendTo(game.hud_g);
  
  // Texte de status
  this.state_text = snap.text(svgWidth - 10, 4, "waiting for connection (F5)")
    .addClass("state")
    .appendTo(game.hud_g);
  
  // Tableau des scores
  this.scoreboard_g = snap.g()
    .addClass('scoreboard')
    .appendTo(game.hud_g);
  
  this.scoreboard_texts = {};
  
  // Cadre
  this.frame_rect = snap.rect(0, 0, "100%", "100%")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("strokeWidth", "9px")
};



/**
 * Mettre à jour l'état du jeu
 * @param (string) state
 */
HUD.prototype.updateState = function()
{
  if (game.state === "waiting for start")
    this.state_text.node.innerHTML = "";
  
  else if (game.state === "playing")
  {
    if (game.countdown > 0)
      this.state_text.node.innerHTML = game.countdown;
    
    // Fin du jeu
    else
    {
      this.state_text.node.innerHTML = "";
      this.countPoints();
    }
  }
  
  else
    this.state_text.node.innerHTML = game.state;
  
  
  Snap.animate(0.4, 1, function(n) {
    hud.state_text.attr({
      opacity: n
    });
  }, 1000, mina.easeout);
}


/**
 * Mettre à jour le compte à rebour du départ
 * @param (number) countdown
 */
HUD.prototype.updateStartCountdown = function(countdown)
{
  if (countdown <= 5)
  {
    hud.center_text.attr("visibility", "visible");
    this.state_text.node.innerHTML = "";
    this.center_text.node.innerHTML = countdown;
    
    // Démarrage du compte à rebours
    if (countdown == 5)
    {
      Snap.animate(1, 3, function(n) {
        hud.center_text.attr({
          fontSize: n * 64 + "px"
        });
      }, 1000 * (countdown), mina.easeout);
    }
    
    else if (countdown > 0)
    {
      Snap.animate(0.4, 1, function(n) {
        hud.center_text.attr({
          opacity: n
        });
      }, 1000, mina.easeout);
    }
    
    // Fin du compte à rebours
    else
    {
      this.center_text.node.innerHTML = "GO !";
      this.flash();
    
      Snap.animate(1, 0, function(n) {
        hud.center_text.attr({
          fontSize: 3 * 64 + (1-n) * 72 + "px",
          opacity: (n<0.25?n/0.25:1)
        });
      }, 500, mina.easeout, function() {
        hud.center_text.attr("visibility", "hidden");
      });
    }
  }
}

/**
 * Afficher le message Game Over
 */
HUD.prototype.gameOver = function()
{
  this.center_text.attr("visibility", "visible");
  this.center_text.node.innerHTML = "GAME OVER !";
  this.flash();

  Snap.animate(1, 0, function(n) {
    hud.center_text.attr({
      fontSize: 64 + (1-n) * 72 + "px",
      opacity: (n<0.5?n/0.5:1)
    });
  }, 500, mina.easein, function() {
    hud.center_text.attr("visibility", "hidden");
    hud.scoreboard();
  });
}

/**
 * Afficher le tableau des scores
 */
HUD.prototype.scoreboard = function()
{
  this.scoreboard_g.attr("opacity", 1).clear();
  this.scoreboard_texts = [];
  
  var n = 0,
      scorePositions = {},
      playersNumber = game.countPlayers();
  
  for (var i in game.players)
  {
    var scoreX = svgWidth/2 - playersNumber/2*32 + n*32+16,
        scoreY = svgHeight/2;
    
    this.scoreboard_texts[i] = snap.text(scoreX, scoreY, "0")
      .appendTo(this.scoreboard_g)
      .attr("opacity", "0")
      .animate({opacity: 1}, 300);
    
    scorePositions[i] = {x: scoreX, y: scoreY};
    
    n++;
  }
  
  game.grid.searchScores(0, 0, scorePositions);
}


/**
 * Effectuer un flash
 */
HUD.prototype.flash = function()
{
  this.flash_rect.attr("visibility", "visible");
  
  Snap.animate(1, 0, function(n) {
    hud.flash_rect.attr({
      opacity: n
    });
  }, 1000, mina.easein, function() {
    hud.flash_rect.attr("visibility", "hidden");
  });
}


/**
 * Mettre à jour le cadre du jeu
 */
HUD.prototype.updateFrame = function(color) {
  console.log(Snap.hsl(color, 100, 50));
  this.frame_rect.animate({stroke: Snap.hsl(color, 100, 50)}, 100);
}

/**
 * Mettre à jour un score affiché sur le tableau des scores
 */
HUD.prototype.updateScore = function(playerid)
{
  var text = hud.scoreboard_texts[playerid];
  text.node.innerHTML = game.players[playerid].score;
  text.attr("opacity", "0").animate({opacity: 1}, 150, mina.easeout);
}
