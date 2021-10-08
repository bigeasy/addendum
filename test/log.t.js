require('proof')(10, okay => {
    const Log = require('../log')
    const log = new Log(3)

    okay({
        size: log.size, length: log.length
    }, {
        size: 0, length: 0
    }, 'initial')
    okay(log.find(0, event => Log.equal([ '', 'x' ], event.path)), [], 'empty')
    okay(log.add({ path: [ '', 'x' ], value: 1 }), { path: [ '', 'x' ], value: 1 }, 'add')
    okay({
        size: log.size, length: log.length
    }, {
        size: 1, length: 1
    }, 'added')
    log.add({ path: [ '', 'y' ], value: 2 })
    log.add({ path: [ '', 'x' ], value: 3 })
    okay({
        size: log.size, length: log.length
    }, {
        size: 3, length: 3
    }, 'filled')
    okay(log.find(0, event => Log.equal([ '', 'x' ], event.path)), [{
        path: [ '', 'x' ], value: 1
    }, {
        path: [ '', 'x' ], value: 3
    }], 'find')
    log.add({ path: [ '', 'z' ], value: 4 })
    okay({
        size: log.size, length: log.length
    }, {
        size: 3, length: 4
    }, 'gone past')
    okay(log.find(0, event => Log.equal([ '', 'x' ], event.path)), null, 'index too early')
    okay(log.find(1, event => Log.equal([ '', 'x' ], event.path)), [{
        path: [ '', 'x' ], value: 3
    }], 'find')
    okay(log.find(2, event => Log.equal([ '', 'x' ], event.path)), [{
        path: [ '', 'x' ], value: 3
    }], 'find with skip')
})
