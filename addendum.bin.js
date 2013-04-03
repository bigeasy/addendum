#!/usr/bin/env node

var arguable = require('arguable'), cadence = require('cadence');

/*
    ___ initialize _ usage: en_US ___
    ___ usage: en_US ___
    addendum <command>

    commands:

      status
      update
      rollback
      snapshot

    ___ usage ___
*/

arguable.parse(process.env.LANG || 'en_US', __filename, process.argv.slice(2), main);

function main (options) {
  console.log('done');
}
