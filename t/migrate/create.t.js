#!/usr/bin/env node

require("proof")(1, function (step, ok) {
  require('../..');
  ok(1, 'noop');
});

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
