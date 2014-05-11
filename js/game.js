$(function(){
  "use strict";

  var globals = {
    canvas: null,
    context: null,
    minesFound: 0,
    tilesRevealed: 0,
    flags: 0, 
    firstClick: true,
    gameOver: false,
    time: 0,
    clock: '',
    grid: ''
  },

  settings = {
    tileSize: 48,
    gutterSize: 5,
    tilesX: 9,
    tilesY: 9,
    background: 'white',
    font: '24px Open Sans',
    iconFont: '24px icomoon',
    tileColor: '#dddddd',
    tileRadius: 5,
    mineIcon: 'e600',
    flagIcon: 'e601',
    width: 500,
    height: 500,
    totalMines: 10
  },

  layout = {
    mines: $('#mines'),
    status: $('#status'),
    time: $('#timer'),  
    reset: $('#status')
  };

  var tile = function(x,y) {
      this.xPos = x,
      this.yPos = y,
      this.revealed = false,
      this.mine = false,
      this.flag = false,
      this.value = 0;
  };

  function init() {
    //set up canvas 
    globals.canvas = $('#grid');
    globals.context = globals.canvas[0].getContext("2d");
    globals.context.background = settings.background;
    globals.context.font = "30px Arial";
    settings.width = (settings.tilesX * settings.tileSize) + ((settings.tilesX * settings.gutterSize) - settings.gutterSize);
    settings.height = (settings.tilesY * settings.tileSize) + ((settings.tilesY * settings.gutterSize) - settings.gutterSize);
    globals.canvas[0].width = settings.width;
    globals.canvas[0].height = settings.height;
    globals.context.strokeStyle = settings.tileColor;
    globals.context.fillStyle = settings.tileColor;

    //attach listeners
    globals.canvas.on({
      mousedown: function(e) {
        mouseDown(e);
      },
      mouseup: function(e){
        mouseUp(e);
      }
    });

    layout.reset.on({
      click: function(){
        reset();
      }
    }); 

    createGrid();
    drawGrid();
  }

  function createGrid () {    

    //create grid of tiles
    globals.grid = new Array(settings.tilesX);

    for (var i = 0; i < settings.tilesX; i++) {
      globals.grid[i] = new Array(settings.tilesY);
    }

    var x = 0,
        y = 0;

    for (var j = 0; j < settings.tilesX; j++) {
      for (var k = 0; k < settings.tilesY; k++) {
        x = (settings.tileSize + settings.gutterSize) * j;
        y = (settings.tileSize + settings.gutterSize) * k;
        globals.grid[j][k] = new tile(x, y);               
      }
    } 
  }

  function reset () {
  
    // Clear the timer
    window.clearInterval(globals.clock);
    window.clearInterval(globals.restart);
  
    // Wipe the canvas clean
    globals.context.clearRect(0,0,settings.width,settings.height);
    
    // Reset all global vars
    globals.gameOver = false;
    globals.firstClick = true;
    globals.minesFound = 0;
    globals.flags = 0;
    globals.tilesRevealed = 0;
    globals.time = 0;
    globals.grid = '';    
        
    // reset scores
    layout.mines.html('010');
    layout.time.html('000');
    layout.status.removeClass('icon-cool icon-angry').addClass('icon-smiley');      

    //recreate grid
    createGrid();
    drawGrid();
  }       

  function drawGrid() {

    generateMines();
    detectMines();
    updateScore();

    for (var i = 0; i < globals.grid.length; ++i) {    
      for (var j = 0; j < globals.grid[i].length; ++j) {

        globals.context.strokeStyle = settings.tileColor;
        globals.context.fillStyle = settings.tileColor;
        drawTile(globals.grid[i][j].xPos, globals.grid[i][j].yPos);       
      
      }
    }
  }

  function drawTile(x,y) {  

    var width = settings.tileSize,
        height = settings.tileSize;
      
    globals.context.beginPath();
    globals.context.moveTo(x + settings.tileRadius, y);
    globals.context.lineTo(x + width - settings.tileRadius, y);
    globals.context.quadraticCurveTo(x + width, y, x + width, y + settings.tileRadius);
    globals.context.lineTo(x + width, y + height - settings.tileRadius);
    globals.context.quadraticCurveTo(x + width, y + height, x + width - settings.tileRadius, y + height);
    globals.context.lineTo(x + settings.tileRadius, y + height);
    globals.context.quadraticCurveTo(x, y + height, x, y + height - settings.tileRadius);
    globals.context.lineTo(x, y + settings.tileRadius);
    globals.context.quadraticCurveTo(x, y, x + settings.tileRadius, y);
    globals.context.closePath();
    globals.context.stroke();
    globals.context.fill();       

  }

  function drawBase (value, x, y) {
    var colors = ['none', 'blue', 'green', 'red', 'darkblue', 'brown', 'cyan', 'black', 'gray'];
    globals.context.fillStyle = colors[value];
    globals.context.font= settings.font;
    globals.context.fillText(value, x + 16 , y + 32);   
  }

  function drawFlag(x,y) {
    globals.context.fillStyle = "#333333";
    globals.context.font= settings.iconFont;
    globals.context.fillText(String.fromCharCode("0xe601"), x + settings.tileSize / 4 , y + 34);  
  }

  function drawMine(x,y) {
    globals.context.fillStyle = 'blue';
    globals.context.font= settings.iconFont;
    globals.context.fillText(String.fromCharCode("0xe606"), x + 12 , y + 34); 
  }

  function drawCross(x,y) {
    var width = settings.tileSize,
        height = settings.tileSize;

    globals.context.strokeStyle = 'red';
    globals.context.fillStyle = 'red';
    globals.context.beginPath();
    globals.context.moveTo(x, y);
    globals.context.lineTo(x + width, y + width);
    globals.context.moveTo(x + width, y);
    globals.context.lineTo(x, y + width);
    globals.context.closePath();
    globals.context.stroke();     
  }
    
  function generateMines () {

    //set mines in random positions   
    for (var i = 0; i < settings.totalMines; i++) {
      var j = Math.floor(Math.random() * settings.tilesX);
      var k = Math.floor(Math.random() * settings.tilesY);

      if (globals.grid[j][k].mine) {
        //if tile already contains a mine, try again
        i--;
      } else {
        globals.grid[j][k].mine = true;
      }

    }

  } 

  function detectMines() {

    //loop through grid
    for(var x = 0; x < settings.tilesX; x++){
      for(var y = 0; y < settings.tilesY; y++){
  
        //if tile doesn't contain a mine, loop through neighbouring tiles
        if(!globals.grid[x][y].mine) {
          
          var xArr = [x, x + 1, x - 1],
              yArr = [y, y + 1, y - 1];           
  
          for(var a = 0; a < 3; a++){
            for(var b = 0; b < 3; b++){
              //check valid coords
              if (xArr[a] >= 0 &&  xArr[a] < settings.tilesX && yArr[b] >= 0 && yArr[b] < settings.tilesY) {
                //check for mine
                if (globals.grid[xArr[a]][yArr[b]].mine) {                  
                  //if neighbour has a mine, increment mine count 
                  globals.grid[x][y].value++;
                }
              }
            }
          }
          
        }  
      } 
    }

  }

  function revealAllMines() {

    //on game over display all mines
    for (var x = 0; x < globals.grid.length; x++) {    
      for (var y = 0; y < globals.grid[x].length; y++) {

        //if tile has a mine and hasn't been flagged
        if (globals.grid[x][y].mine && !globals.grid[x][y].flag ) {
          drawMine(globals.grid[x][y].xPos, globals.grid[x][y].yPos);
        }

        //if incorrect flag has been set draw cross
        if (globals.grid[x][y].flag && !globals.grid[x][y].mine) {        
          
          drawCross(globals.grid[x][y].xPos, globals.grid[x][y].yPos);
        }

      }
    }  

  }

  function revealTile(x,y) {
    globals.context.strokeStyle = settings.background;
    globals.context.fillStyle = settings.background;
    drawTile(globals.grid[x][y].xPos,globals.grid[x][y].yPos);
    drawBase(globals.grid[x][y].value, globals.grid[x][y].xPos, globals.grid[x][y].yPos);
    globals.grid[x][y].revealed = true;
    globals.tilesRevealed++;
    updateScore();
    checkWin();       
  }

  function revealMine(x,y) {

    if (globals.grid[x][y].mine) {
      globals.context.strokeStyle = 'red';
      globals.context.fillStyle = 'red';
      drawTile(globals.grid[x][y].xPos,globals.grid[x][y].yPos);
      drawMine(globals.grid[x][y].xPos, globals.grid[x][y].yPos);
      globals.grid[x][y].revealed = true; 
    }

  }

  function reveal(x,y) {

    //check tile has not been revealed already and has no flag set
    if(!globals.grid[x][y].revealed && !globals.grid[x][y].flag) {

      //check for mine
      if (globals.grid[x][y].mine) {
        revealMine(x,y);
        gameOver();

      } else {

        //no mine, reveal square
        revealTile(x,y);

        //if empty tile, reveal neighbouring tiles
        if(globals.grid[x][y].value === 0) {
          //loop through surrounding tiles and reveal tiles with no mines & no flags    
          var xArr = [x, x + 1, x - 1],
              yArr = [y, y + 1, y - 1]; 

          for(var a = 0; a < 3; a++){
            for(var b = 0; b < 3; b++){
              
              //check for valid coordinates
              if (xArr[a] >= 0 &&  xArr[a] < settings.tilesX && yArr[b] >= 0 && yArr[b] < settings.tilesY && !(xArr[a] == x && yArr[b] == y)) {
                
                //check tile isn't a mine, hasn't been revealed and hasn't been flagged
                if (!globals.grid[xArr[a]][yArr[b]].mine && !globals.grid[xArr[a]][yArr[b]].revealed && !globals.grid[xArr[a]][yArr[b]].flag) {

                  if (globals.grid[xArr[a]][yArr[b]].value === 0) {
                    reveal(xArr[a],yArr[b]);
                    //tile is empty, check neighbours
                  } else {
                    //reveal tile
                    revealTile(xArr[a],yArr[b]);                
                  }
                }
              }
            }
          }
        }     
          
      }

    }
    
  }

  function flagMines () {

    //game has been won, flag remaining tiles
    for (var x = 0; x < globals.grid.length; ++x) {    
      for (var y = 0; y < globals.grid[x].length; ++y) {

        //if tile has a mine and hasn't been flagged then set flag
        if (globals.grid[x][y].mine && !globals.grid[x][y].flag ) {
          drawFlag(globals.grid[x][y].xPos, globals.grid[x][y].yPos);
          globals.flags++;
          updateScore();
        }       

      }
    }  

  }

  function flag(x,y) {
    if (globals.grid[x][y].flag) {

      //flag already set so remove flag and update totals
      globals.context.clearRect(globals.grid[x][y].xPos, globals.grid[x][y].yPos, settings.tileSize, settings.tileSize);
      globals.context.strokeStyle = settings.tileColor;
      globals.context.fillStyle = settings.tileColor;
      drawTile(globals.grid[x][y].xPos, globals.grid[x][y].yPos);

      globals.grid[x][y].flag = false;  
      globals.flags--;
      updateScore();

    } else if (!globals.grid[x][y].revealed) {
      //if tile hasn't been revealed set flag and update totals
      drawBase(globals.grid[x][y].xPos, globals.grid[x][y].yPos);
      drawFlag(globals.grid[x][y].xPos, globals.grid[x][y].yPos);
      
      globals.grid[x][y].flag = true;
      globals.flags++;
      if(globals.grid[x][y].mine) globals.minesFound++;     
      updateScore();
      
    }
    
  }

  function timer () {
    
    globals.clock = setInterval(function(){
      globals.time++;   
      if(globals.time < 10) {
        layout.time.html('00' + globals.time);
      } else if (globals.time < 100) {
        layout.time.html('0' + globals.time);
      } else {
        layout.time.html(globals.time);
      }
    }, 1000); 

  }

  function updateScore () {
    var score = settings.totalMines - globals.flags;

    if (score < 0) {
      score > -10 ? layout.mines.html('-0' + Math.abs(score)) : layout.mines.html('-' + Math.abs(score));      
    } else if (score < 10) {   
      layout.mines.html('00' + score);
    } else if(score < 100) {
      layout.mines.html('0' + score);
    } else {
      layout.mines.html(score);
    }

  }

  function checkWin () {
    //player wins if all non-mine tiles have been revealed
    if (globals.tilesRevealed == (settings.tilesX * settings.tilesY - settings.totalMines) ) {
      
      //winner winner, chicken dinner!
      //flag any mines that haven't already been flagged      
      if (globals.minesFound < settings.totalMines) flagMines();
      win();
    }

  }

  function mouseDown(e) {  

    layout.status.addClass('icon-shocked');

  }

  function mouseUp(e){  
    layout.status.removeClass('icon-shocked');

    if(globals.firstClick === true){    
      timer();
      globals.firstClick = false;
    } 

    if (!globals.gameOver) {

      //get mouse position and convert to grid position
      var x = Math.floor((e.pageX - globals.canvas[0].offsetLeft - 1) / (settings.tileSize + settings.gutterSize)),
          y = Math.floor((e.pageY - globals.canvas[0].offsetTop - 1) / (settings.tileSize + settings.gutterSize))

      if(e.which === 1) {

        //on left click reveal tile if it hasn't been revealed and hasn't been flagged
        if (!globals.grid[x][y].revealed && !globals.grid[x][y].flag) {       
          reveal(x,y);            
        }

      } else {
        //right click so flag tile
        flag(x,y);
      }         

    }
   
  }

  function gameOver () {
    layout.status.addClass('icon-angry');
    globals.gameOver = true;
    //stop timer
    window.clearInterval(globals.clock);
    //reveal all mines
    revealAllMines();   
  }

  function win () {
    layout.status.addClass('icon-cool')

    //stop timer
    window.clearInterval(globals.clock);  

    $("#winner").css({    
      "display": "block",  
      "opacity": 1,
      "width": settings.width,
      "margin-left": - settings.width /2,
      "top": settings.height + 169
    });

    //$("#winner").animate({opacity:1}, 50);
    $("#winner").animate({top: "-=" + settings.height}, 2000);
    $("#winner").animate({opacity:0}, 500);
  }

  init();

});