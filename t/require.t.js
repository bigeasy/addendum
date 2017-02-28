require('proof/redux')(1, prove)

function prove (assert) {
    var bin = require('../addendum.bin')
    assert(bin, 'require')
}
