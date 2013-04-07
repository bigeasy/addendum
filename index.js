var __slice = [];

module.exports = Addendum;

function Addendum () {
}

function Amendment (addendum) {
  this._opreations = [];
}

capture(Amendment.prototype, 'createSchema(name)');
capture(Amendment.prototype, 'useSchema(name)');

function Table () {
  this._operations = [];
}

function capture (object, method) {
  var $ = /^(\w+)\(([^)]+)\)$/.exec(method);
  var method = $[1], parameters = $[2].split(/\s*,\s*/);
  object[method] = function () {
    var operation = { method: method }, vargs = __slice.call(arguments);
    parameters.forEach(function (parameter, index) {
      operation[parameter] = vargs[index]; 
    });
    this._operations.push(operation);
  }
}

capture(Table.prototype, 'varying(name, length)');
capture(Table.prototype, 'autoid(name)');

Amendment.prototype.createTable = function (name) {
  this._operations.push({ type: 'useSchema', name: name });
}

Addendum.amend = function (builder) {
  var amendment = new Amendment(this);
  builder(amendment);
}
