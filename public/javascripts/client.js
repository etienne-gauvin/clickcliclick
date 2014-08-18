(function()
{
  var svgGame = document.querySelector("#game");
  window.svgWidth  = svgGame.width.baseVal.value;
  window.svgHeight = svgGame.height.baseVal.value;
  
  window.snap = Snap(svgGame);
  window.game = new Game;
  window.hud = new HUD;
})()
