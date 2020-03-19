/**
 * Tower constructor
 */
function Tower() {
  this.x = 0;
  this.y = 0;
  this.size = 1;
  this.hits = 0;
}

Tower.prototype.isSunk = function () {
  return this.hits >= this.size;
};

module.exports = Tower;


