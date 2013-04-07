var __slice = [];

module.exports = function () {
  var a = 1;
  var b = 1;
  return a + b;
};

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

Table.prototype.varying = function (name, length) {
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

capture(Table.prototype, 'autoid(name)');

Amendment.prototype.createTable = function (name) {
  this_operations.push({ type: 'useSchema', name: name });
}

Addendum.amend = function (builder) {
  var amendment = new Amendment(this);
  builder(amendment);
}

exports.addendum = function (addendum) {
  addendum.amend(function (amendment) {
    addendum.createSchema("omnicorp");
    addendum.useSchema("omnicorp");
    addendum.createTable("employees", function (table) {
      table.autoid("id");
      table.varying("first_name", 64);
      table.varying("last_name", 64);
      table.timestamp("updated");
      table.timestamp("created");
    });
  });
  addendum.amend(function (mutator) {
    mutator.insert("employees", { first_name: "Alan", last_name: "Gutierrez" });
    mutator.insert("employees", { first_name: "John", last_name: "Smith" });
    mutator.insert("employees", { first_name: "Priya", last_name: "Patel" });
  });
}
