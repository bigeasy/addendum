require('proof')(1, prove)

function prove (okay) {
    var bin = require('../addendum.bin')
    okay(bin, 'require')
}
