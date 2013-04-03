var pg = require('pg'), cadence = require('cadence');

var storage = cadence(function (step, configuration) {
  var client = new pg.Client(configuration), on = step('on');
  step(function () {
    client.connect(step());
  }, function (connection) {
    client.query('CREATE SCHEMA addendum', step());
  }, function () {
    client.query('\
      CREATE TABLE addendum.property( \
        name VARCHAR, \
        value VARCHAR, \
        PRIMARY KEY (name) \
      ) \
    ', step());
  });
});
