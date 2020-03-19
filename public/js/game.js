var GameStatus = {
  inProgress: 1,
  gameOver: 2
}

var Game = (function () {
  var canvas = [], context = [], grid = [],
    gridHeight = 400, gridWidth = 400, gridBorder = 1,
    gridRows = 30, gridCols = 40, markPadding = 10, shipPadding = 1,
    squareHeight = (gridHeight - gridBorder * gridRows - gridBorder) / gridRows,
    squareWidth = (gridWidth - gridBorder * gridCols - gridBorder) / gridCols,
    turn = false, gameStatus, squareHover = { x: -1, y: -1 };

  canvas[0] = document.getElementById('canvas-grid1');    // This player
  canvas[1] = document.getElementById('canvas-grid2');    // Opponent
  context[0] = canvas[0].getContext('2d');
  context[1] = canvas[1].getContext('2d');

  /**
   * Highlight opponent square on hover
   */
  canvas[1].addEventListener('mousemove', function (e) {
    var pos = getCanvasCoordinates(e, canvas[1]);
    squareHover = getSquare(pos.x, pos.y);
    drawGrid(1);
  });

  /**
   * Mouse moved out of opponent grid. Unhighlight.
   */
  canvas[1].addEventListener('mouseout', function (e) {
    squareHover = { x: -1, y: -1 };
    drawGrid(1);
  });

  /**
   * Fire shot on mouse click event (if it's user's turn).
   */
  canvas[1].addEventListener('click', function (e) {
    if (turn) {
      var pos = getCanvasCoordinates(e, canvas[1]);
      var square = getSquare(pos.x, pos.y);
      sendShot(square);
    }
  });

  /**
   * Get square from mouse coordinates
   * @param {type} x Mouse x
   * @param {type} y Mouse y
   * @returns {Object}
   */
  function getSquare(x, y) {
    return {
      x: Math.floor(x / (gridWidth / gridCols)),
      y: Math.floor(y / (gridHeight / gridRows))
    };
  };

  /**
   * Get mouse position on canvas relative to canvas top,left corner
   * @param {type} event
   * @param {type} canvas
   * @returns {Object} Position
   */
  function getCanvasCoordinates(event, canvas) {
    rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
      y: Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
  };

  /**
   * Init new game
   */
  function initGame() {
    var i;

    gameStatus = GameStatus.inProgress;

    // Create empty grids for player and opponent
    grid[0] = { shots: Array(gridRows * gridCols), ships: [] };
    grid[1] = { shots: Array(gridRows * gridCols), ships: [] };

    for (i = 0; i < gridRows * gridCols; i++) {
      grid[0].shots[i] = 0;
      grid[1].shots[i] = 0;
    }

    // Reset turn status classes
    $('#turn-status').removeClass('alert-your-turn').removeClass('alert-opponent-turn')
      .removeClass('alert-winner').removeClass('alert-loser');

    drawGrid(0);
    drawGrid(1);
  };

  /**
   * Update player's or opponent's grid.
   * @param {type} player
   * @param {type} gridState
   * @returns {undefined}
   */
  function updateGrid(player, gridState, earth) {
    grid[player] = gridState;
    drawGrid(player);
    drawGridEarth(player, earth)
  };

  /**
   * Set if it's this client's turn
   * @param {type} turnState
   * @returns {undefined}
   */
  function setTurn(turnState) {
    if (gameStatus !== GameStatus.gameOver) {
      turn = turnState;

      if (turn) {
        $('#turn-status').removeClass('alert-opponent-turn').addClass('alert-your-turn').html('¡¡¡ Es su turno !!!');
      } else {
        $('#turn-status').removeClass('alert-your-turn').addClass('alert-opponent-turn').html('... Esperando al contrincante ...');
      }
    }
  };

  /**
   * Set game over and show winning/losing message
   * @param {Boolean} isWinner
   */
  function setGameOver(isWinner) {
    gameStatus = GameStatus.gameOver;
    turn = false;

    if (isWinner) {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
        .addClass('alert-winner').html('Has ganado <a href="#" class="btn-leave-game">Jugar de nuevo</a>.');
    } else {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
        .addClass('alert-loser').html('Perdiste. <a href="#" class="btn-leave-game">Jugar de nuevo</a>.');
    }
    $('.btn-leave-game').click(sendLeaveRequest);
  }

  /*
   * Draw a grid with squares, ships and shot marks
   */
  function drawGridEarth(gridIndex, earth) {
    drawEarth(gridIndex, earth.earths)
    drawTowers(gridIndex, earth.towers)
    drawGrid(1);
  };

  /*
   * Draw a grid with squares, ships and shot marks
   */
  function drawGrid(gridIndex) {
    drawSquares(gridIndex);
    drawShips(gridIndex);
    drawMarks(gridIndex);
  };

  /**
   * Draw grid squares/background
   * @param {Number} gridIndex
   */
  function drawSquares(gridIndex) {
    var i, j, squareX, squareY;

    context[gridIndex].fillStyle = '#222222'
    context[gridIndex].fillRect(0, 0, gridWidth, gridHeight);

    for (i = 0; i < gridRows; i++) {
      for (j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;

        context[gridIndex].fillStyle = '#7799FF'

        // Highlight square if it's user's turn and user hovers over an unfired on, opponent square.
        if (j === squareHover.x && i === squareHover.y &&
          gridIndex === 1 && grid[gridIndex].shots[i * gridCols + j] === 0 && turn) {
          context[gridIndex].fillStyle = '#4477FF';
        }

        context[gridIndex].fillRect(squareX, squareY, squareWidth, squareHeight);
      }
    }
  };

  /**
   * Draw visible ships on grid
   * @param {Number} gridIndex
   */
  function drawShips(gridIndex) {
    var ship, i, x, y,
      shipWidth, shipLength;

    context[gridIndex].fillStyle = '#444444';

    for (i = 0; i < grid[gridIndex].ships.length; i++) {
      ship = grid[gridIndex].ships[i];

      x = ship.x * (squareWidth + gridBorder) + gridBorder + shipPadding;
      y = ship.y * (squareHeight + gridBorder) + gridBorder + shipPadding;

      if (ship.horizontal) {
        shipWidth = squareHeight - shipPadding * 2;
        shipLength = squareWidth * ship.size + (gridBorder * (ship.size - 1)) - shipPadding * 2;
        context[gridIndex].fillRect(x, y, shipLength, shipWidth);
      } else {
        shipWidth = squareWidth - shipPadding * 2;
        shipLength = squareHeight * ship.size + (gridBorder * (ship.size - 1)) - shipPadding * 2;
        context[gridIndex].fillRect(x, y, shipWidth, shipLength);
      }
    }
  };

  /**
   * Draw shot marks on grid (black crosses for missed and red circles for hits)
   * @param {Number} gridIndex
   */
  function drawTowers(gridIndex, towers) {
    var tower, i, x, y,
      towerWidth, towerLength

    context[gridIndex].fillStyle = '#ffffff';

    for (i = 0; i < towers.length; i++) {
      tower = towers[i];

      x = tower.x * (squareWidth + gridBorder) + gridBorder + shipPadding;
      y = tower.y * (squareHeight + gridBorder) + gridBorder + shipPadding;

      towerWidth = squareWidth * tower.size + (gridBorder * (tower.size - 1)) - shipPadding * 2;
      towerLength = squareHeight * tower.size + (gridBorder * (tower.size - 1)) - shipPadding * 2;
      context[gridIndex].fillRect(x, y, towerWidth, towerLength);
    }
  };

  /**
   * Draw shot marks on grid (black crosses for missed and red circles for hits)
   * @param {Number} gridIndex
   */
  function drawEarth(gridIndex, earths) {
    var earth, i, x, y,
      earthWidth, earthLength

    context[gridIndex].fillStyle = '#804000';

    for (i = 0; i < earths.length; i++) {
      earth = earths[i];

      x = earth.x * (squareWidth + gridBorder) + gridBorder;
      y = earth.y * (squareHeight + gridBorder) + gridBorder;

      earthWidth = squareWidth * earth.size + (gridBorder * (earth.size - 1));
      earthLength = squareHeight * earth.size + (gridBorder * (earth.size - 1));
      context[gridIndex].fillRect(x, y, earthWidth, earthLength);
    }
  };

  /**
   * Draw shot marks on grid (black crosses for missed and red circles for hits)
   * @param {Number} gridIndex
   */
  function drawMarks(gridIndex) {
    var i, j, squareX, squareY;

    for (i = 0; i < gridRows; i++) {
      for (j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;

        // draw black cross if there is a missed shot on square
        if (grid[gridIndex].shots[i * gridCols + j] === 1) {
          context[gridIndex].beginPath();
          context[gridIndex].moveTo(squareX + markPadding, squareY + markPadding);
          context[gridIndex].lineTo(squareX + squareWidth - markPadding, squareY + squareHeight - markPadding);
          context[gridIndex].moveTo(squareX + squareWidth - markPadding, squareY + markPadding);
          context[gridIndex].lineTo(squareX + markPadding, squareY + squareHeight - markPadding);
          context[gridIndex].strokeStyle = '#000000';
          context[gridIndex].stroke();
        }
        // draw red circle if hit on square
        else if (grid[gridIndex].shots[i * gridCols + j] === 2) {
          context[gridIndex].beginPath();
          const x = squareX + (squareWidth / 2);
          const y = squareY + (squareHeight / 2);
          const radiusX = squareWidth / 2 - shipPadding
          const radiusY = squareHeight / 2 - shipPadding

          console.log(x, y, radiusX, radiusY);

          context[gridIndex].ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
          context[gridIndex].fillStyle = '#E62E2E';
          context[gridIndex].fill();
        }
      }
    }
  };

  return {
    'initGame': initGame,
    'updateGrid': updateGrid,
    'setTurn': setTurn,
    'setGameOver': setGameOver
  };
})();
