var Ship = require('./ship.js');
var Tower = require('./tower.js');
var Settings = require('./settings.js');
var Earth = require('./earth.js');

/**
 * Player constructor
 * @param {type} id Socket ID
 */
function Player(id) {
  var i;

  this.id = id;
  this.shots = Array(Settings.gridRows * Settings.gridCols);
  this.shipGrid = Array(Settings.gridRows * Settings.gridCols);
  this.towerGrid = Array(Settings.gridRows * Settings.gridCols);
  this.earths = []
  this.ships = [];
  this.towers = [];

  for (i = 0; i < Settings.gridRows * Settings.gridCols; i++) {
    this.shots[i] = 0;
    this.shipGrid[i] = -1;
    this.towerGrid[i] = -1;
  }

  this.createRandomEarths()

  this.createRandomTowers()

  this.createRandomShips()
};

/**
 * Fire shot on grid
 * @param {type} gridIndex
 * @returns {Boolean} True if hit
 */
Player.prototype.shoot = function (gridIndex) {
  if (this.shipGrid[gridIndex] >= 0) {
    // Hit!
    this.ships[this.shipGrid[gridIndex]].hits++;
    this.shots[gridIndex] = 2;
    return true;
  } else {
    if (this.shipGrid[gridIndex] == -3) {
      this.towers[this.towerGrid[gridIndex]].hits++;
      this.shots[gridIndex] = 2;
      return true;
    } else {
      // Miss
      this.shots[gridIndex] = 1;
      return false;
    }
  }
};

/**
 * Get an array of sunk ships
 * @returns {undefined}
 */
Player.prototype.getSunkShips = function () {
  var i, sunkShips = [];

  for (i = 0; i < this.ships.length; i++) {
    if (this.ships[i].isSunk()) {
      sunkShips.push(this.ships[i]);
    }
  }

  return sunkShips;
};

/**
 * Get an array of sunk towers
 * @returns {undefined}
 */
Player.prototype.getSunkTowers = function () {
  var i, sunkTowers = [];

  for (i = 0; i < this.towers.length; i++) {
    if (this.towers[i].isSunk()) {
      sunkTowers.push(this.towers[i]);
    }
  }

  return sunkTowers;
};

/**
 * Get the number of towers left
 * @returns {Number} Number of towers left
 */
Player.prototype.getTowersLeft = function () {
  var i, towerCount = 0;

  for (i = 0; i < this.towers.length; i++) {
    if (!this.towers[i].isSunk()) {
      towerCount++;
    }
  }

  return towerCount;
}

/**
 * Get the number of ships left
 * @returns {Number} Number of ships left
 */
Player.prototype.getShipsLeft = function () {
  var i, shipCount = 0;

  for (i = 0; i < this.ships.length; i++) {
    if (!this.ships[i].isSunk()) {
      shipCount++;
    }
  }

  return shipCount;
}

/**
 * Create earths and place them randomly in grid
 * @returns {Boolean}
 */
Player.prototype.createRandomEarths = function () {
  var earthIndex;

  for (earthIndex = 0; earthIndex < Settings.earths.length; earthIndex++) {
    const size = Settings.earths[earthIndex]
    earth = new Earth(size);

    if (!this.placeEarthRandom(earth)) {
      return false;
    }

    this.earths.push(earth);
  }

  return true;
};


/**
 * Create towers and place them randomly in grid
 * @returns {Boolean}
 */
Player.prototype.createRandomTowers = function () {
  var towerIndex;

  for (towerIndex = 0; towerIndex < Settings.towers.length; towerIndex++) {
    tower = new Tower();

    if (!this.placeTowerRandom(tower, towerIndex)) {
      return false;
    }

    this.towers.push(tower);
  }

  return true;
};

/**
 * Create ships and place them randomly in grid
 * @returns {Boolean}
 */
Player.prototype.createRandomShips = function () {
  var shipIndex;

  for (shipIndex = 0; shipIndex < Settings.ships.length; shipIndex++) {
    ship = new Ship(Settings.ships[shipIndex]);

    if (!this.placeShipRandom(ship, shipIndex)) {
      return false;
    }

    this.ships.push(ship);
  }

  return true;
};

/**
 * Try to place a earth randomly in grid without overlapping another tower.
 * @param {Earth} earth
 * @param {Number} shipIndex
 * @returns {Boolean}
 */
Player.prototype.placeEarthRandom = function (earth) {
  var i, xMax, yMax, tryMax = 250;

  for (i = 0; i < tryMax; i++) {

    xMax = Settings.gridCols;
    yMax = Settings.gridRows;

    earth.x = Math.floor(Math.random() * xMax);
    earth.y = Math.floor(Math.random() * yMax);
    if (!this.checkEarthOverlap(earth)) {
      this.fillEarth(earth)
      return true;
    }
  }

  return false;
}

/**
 * Try to place a tower randomly in grid without overlapping another tower.
 * @param {Tower} tower
 * @param {Number} shipIndex
 * @returns {Boolean}
 */
Player.prototype.placeTowerRandom = function (tower, towerIndex) {
  var i, gridIndex, xMax, yMax, tryMax = 250;

  for (i = 0; i < tryMax; i++) {

    xMax = Settings.gridCols;
    yMax = Settings.gridRows;

    tower.x = Math.floor(Math.random() * xMax);
    tower.y = Math.floor(Math.random() * yMax);

    if (!this.checkTowerOverlap(tower) && this.isPosEarth(tower)) {
      // success - tower does not overlap or is adjacent to other ships
      // place tower array-index in shipGrid
      gridIndex = tower.y * Settings.gridCols + tower.x;
      this.shipGrid[gridIndex] = -3;
      this.towerGrid[gridIndex] = towerIndex;
      return true;
    }
  }

  return false;
}

/**
 * Try to place a ship randomly in grid without overlapping another ship.
 * @param {Ship} ship
 * @param {Number} shipIndex
 * @returns {Boolean}
 */
Player.prototype.placeShipRandom = function (ship, shipIndex) {
  var i, j, gridIndex, xMax, yMax, tryMax = 25;

  for (i = 0; i < tryMax; i++) {
    ship.horizontal = Math.random() < 0.5;

    xMax = ship.horizontal ? Settings.gridCols - ship.size + 1 : Settings.gridCols;
    yMax = ship.horizontal ? Settings.gridRows : Settings.gridRows - ship.size + 1;

    ship.x = Math.floor(Math.random() * xMax);
    ship.y = Math.floor(Math.random() * yMax);

    if (!this.checkShipOverlap(ship) && !this.checkShipAdjacent(ship) && this.isPosWater(ship)) {
      // success - ship does not overlap or is adjacent to other ships
      // place ship array-index in shipGrid
      gridIndex = ship.y * Settings.gridCols + ship.x;
      for (j = 0; j < ship.size; j++) {
        this.shipGrid[gridIndex] = shipIndex;
        gridIndex += ship.horizontal ? 1 : Settings.gridCols;
      }
      return true;
    }
  }

  return false;
}

/**
 * Check if a tower overlaps another tower in the grid.
 * @param {Tower} ship
 * @returns {Boolean} True if tower overlaps
 */
Player.prototype.isPosEarth = function (tower) {
  var gridIndex = tower.y * Settings.gridCols + tower.x;

  if (this.shipGrid[gridIndex] == -2) {
    return true;
  }

  return false;
}

/**
 * Check if a ship overlaps another ship in the grid.
 * @param {Ship} ship
 * @returns {Boolean} True if ship overlaps
 */
Player.prototype.isPosWater = function (ship) {
  let gridIndex = ship.y * Settings.gridCols + ship.x;
  let isWater = true
  for (j = 0; j < ship.size; j++) {
    if (this.shipGrid[gridIndex] != -1 ) {
      isWater = false;
    }
    gridIndex += ship.horizontal ? 1 : Settings.gridCols;
  }
  return isWater;
}

/**
 * Check if a earth overlaps another earth in the grid.
 * @param {Earth} earth
 * @returns {Boolean} True if ship overlaps
 */
Player.prototype.fillEarth = function (earth) {
  let x = earth.x
  let y = earth.y
  var i, gridIndex;

  for (i = 0; i < earth.size * earth.size; i++) {
    gridIndex = y * Settings.gridCols + x;
    this.shipGrid[gridIndex] = -2;
    if (x == earth.x + earth.size - 1) {
      x = earth.x;
      y++;
    } else {
      x++;
    }
  }

  return false;
}

/**
 * Check if a earth overlaps another earth in the grid.
 * @param {Earth} earth
 * @returns {Boolean} True if ship overlaps
 */
Player.prototype.checkEarthOverlap = function (earth) {
  let x = earth.x
  let y = earth.y
  var i, gridIndex;

  for (i = 0; i < earth.size * earth.size; i++) {
    gridIndex = y * Settings.gridCols + x;
    if (this.shipGrid[gridIndex] >= 0 || this.shipGrid[gridIndex] == -2 || x >= (Settings.gridCols - 1) || y >= (Settings.gridRows - 1)) {
      return true;
    }
    if (x == earth.x + earth.size - 1) {
      x = earth.x;
      y++;
    } else {
      x++;
    }
  }

  return false;
}


/**
 * Check if a tower overlaps another tower in the grid.
 * @param {Tower} tower
 * @returns {Boolean} True if ship overlaps
 */
Player.prototype.checkTowerOverlap = function (tower) {
  var gridIndex = tower.y * Settings.gridCols + tower.x;

  if (this.shipGrid[gridIndex] == -3) {
    return true;
  }

  return false;
}

/**
 * Check if a ship overlaps another ship in the grid.
 * @param {Ship} ship
 * @returns {Boolean} True if ship overlaps
 */
Player.prototype.checkShipOverlap = function (ship) {
  var i, gridIndex = ship.y * Settings.gridCols + ship.x;

  for (i = 0; i < ship.size; i++) {
    if (this.shipGrid[gridIndex] >= 0) {
      return true;
    }
    gridIndex += ship.horizontal ? 1 : Settings.gridCols;
  }

  return false;
}

/**
 * Check if there are ships adjacent to this ship placement
 * @param {Ship} ship
 * @returns {Boolean} True if adjacent ship found
 */
Player.prototype.checkShipAdjacent = function (ship) {
  var i, j,
    x1 = ship.x - 1,
    y1 = ship.y - 1,
    x2 = ship.horizontal ? ship.x + ship.size : ship.x + 1,
    y2 = ship.horizontal ? ship.y + 1 : ship.y + ship.size;

  for (i = x1; i <= x2; i++) {
    if (i < 0 || i > Settings.gridCols - 1) continue;
    for (j = y1; j <= y2; j++) {
      if (j < 0 || j > Settings.gridRows - 1) continue;
      if (this.shipGrid[j * Settings.gridCols + i] >= 0) {
        return true;
      }
    }
  }

  return false;
}

module.exports = Player;
