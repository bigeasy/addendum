var cadence = require('cadence')
var logger = require('prolific.logger').createLogger('addendum')
var crypto = require('crypto')
var assert = require('assert')
var Cubbyhole = require('cubbyhole')

var Reactor = require('reactor')

function Addendum (cliffhanger, nodes) {
    this._nodes = nodes
    this._index = 0
    this._cliffhanger = cliffhanger
    this._stores = {}
    this._cubbyholes = new Cubbyhole
    this.reactor = new Reactor(this, function (dispatcher) {
        dispatcher.dispatch('GET /', 'index')
        dispatcher.dispatch('POST /register', 'register')
    })
}

Addendum.prototype.index = cadence(function (async) {
    return [ 200, { 'content-type': 'text/plain' }, 'Addendum Consensus API\n' ]
})

Addendum.prototype.register = cadence(function (async, request) {
    this._token = request.body.token
    return 200
})

Addendum.prototype.test = cadence(function (async, conference, body) {
    console.log('GOT TEST', body)
})

Addendum.prototype.join = cadence(function (async, conference) {
    async(function () {
        var socket = null, shifter = null
        if (!conference.replaying) {
            socket = conference.socket({ promise: conference.government.promise })
            socket.write.push(null)
            shifter = socket.read.shifter()
        }
        async(function () {
            conference.record(async)(function () {
                shifter.dequeue(async())
            })
        }, function (envelope) {
            console.log('JOIN', envelope)
            assert(envelope.module == 'addendum' && envelope.method == 'index')
            this._index = envelope.body
        })
        var loop = async(function () {
            conference.record(async)(function () {
                shifter.dequeue(async())
            })
        }, function (envelope) {
            if (envelope == null) {
                return [ loop.break ]
            }
            assert(envelope.module == 'addendum' && envelope.method == 'subscription')
            this._node[envelope.body.path] = envelope.body.node
        })()
    }, function () {
        console.log('----> JOINED', { index: this._index, nodes: this._nodes })
    })
})

Addendum.prototype.immigrate = cadence(function (async, conference, id) {
    console.log('IMMIGRATE', id)
    this._cubbyholes.set(conference.government.promise, null, {
        nodes: JSON.parse(JSON.stringify(this._nodes)),
        index: this._index
    })
})

Addendum.prototype.naturalized = cadence(function (async, conference, promise) {
    delete this._cubbyholes.remove(promise)
})

Addendum.prototype.exile = cadence(function (async, conference, id) {
    this._cubbys.remove(conference.government.exile.promise)
})

Addendum.prototype._socket = cadence(function (async, socket, header) {
    var shifter = socket.read.shifter()
    async(function () {
        console.log('dequeuing')
        shifter.dequeue(async())
    }, function (envelope) {
        console.log('dequeued')
        assert(envelope == null, 'there should be no message body')
       this._cubbyholes.wait(header.promise, async())
    }, function (store) {
        socket.write.push({
            module: 'addendum',
            method: 'index',
            body: store.index
        })
        for (var path in store.nodes) {
            socket.write.push({
                module: 'addendum',
                method: 'index',
                body: { path: path, node: store.nodes[path] }
            })
        }
        socket.write.push(null)
    })
})

Addendum.prototype.socket = function (conference, socket, header) {
    this._socket(socket, header, abend)
}

Addendum.prototype.set = cadence(function (async, conference, envelope) {
    console.log(envelope)
    var node = this._nodes[envelope.body.path] = {
        value: envelope.body.value,
        key: envelope.body.path,
        createdIndex: this._index,
        modifiedIndex: this._index
    }
    this._index++
    if (envelope.from == conference.id) {
        console.log('RESOLVING!')
        this._cliffhanger.resolve(envelope.cookie, [ null, { action: 'set', node: node }])
    }
})

Addendum.prototype.remove = cadence(function (async, set) {
    var node = this.nodes[set.path]
    if (envelope.from == this.paxos.id) {
        var result = {
            action: 'delete',
            node: {
                createdIndex: node.createdIndex,
                key: node.key,
                modifiedIndex: this._index++
            },
            prevNode: node
        }
        this._cliffhanger.resolve(envelope.cookie, [ null, result ])
    }
})

module.exports = Addendum
