require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Addendum = require('../addendum')
    okay(new Addendum, 'construct')
}
