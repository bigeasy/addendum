#!/usr/bin/env node

require("proof")(1, function (step, ok) {
  require('../..');
  ok(1, 'noop');
});
