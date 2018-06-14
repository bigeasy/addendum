var cadence = require('cadence')
var logger = require('prolific.logger').createLogger('addendum')
var crypto = require('crypto')
var assert = require('assert')
var Cubbyhole = require('cubbyhole')
var Cliffhanger = require('cliffhanger')
var UserAgent = require('vizsla')
var Turnstile = require('turnstile')
Turnstile.Queue = require('turnstile/queue')

var Reactor = require('reactor')

function Addendum (compassionUrl) {
    this.nodes = {}
    this._index = 0
    this._cliffhanger = new Cliffhanger
    this._compassionUrl = compassionUrl
    this._cubbyholes = new Cubbyhole
    this._ua = new UserAgent
    this.broadcaster = new Turnstile.Queue(this, '_broadcast', new Turnstile)
    this.reactor = new Reactor(this, function (dispatcher) {
        dispatcher.dispatch('GET /', 'index')
        dispatcher.dispatch('GET /ping', 'ping')
        dispatcher.dispatch('POST /register', 'register')
        dispatcher.dispatch('POST /arrive', 'arrive')
        dispatcher.dispatch('POST /acclimated', 'acclimated')
        dispatcher.dispatch('POST /join', 'join')
        dispatcher.dispatch('POST /backlog', 'backlog')
        dispatcher.dispatch('POST /receive/set', 'receiveSet')
        dispatcher.dispatch('POST /reduced/set', 'reducedSet')
        dispatcher.dispatch('POST /depart', 'depart')
    })
}

Addendum.prototype.index = cadence(function (async) {
    return [ 200, { 'content-type': 'text/plain' }, 'Addendum Consensus API\n' ]
})

Addendum.prototype.ping = cadence(function (async) {
    return 200
})

Addendum.prototype.register = cadence(function (async, request) {
    this._token = request.body.token
    return 200
})

Addendum.prototype.join = cadence(function (async, conference) {
    async(function () {
        this._ua.fetch({
            url: this._compassionUrl,
        }, {
            token: this._token,
            url: './backlog',
            parse: 'json',
            raise: true
        }, async())
    }, function (body) {
        this._index = body.index
        this.nodes = body.nodes
        return 200
    })
})

Addendum.prototype.backlog = cadence(function (async, request) {
    async(function () {
       this._cubbyholes.wait(request.body.promise, async())
    }, function (stored) {
        return stored
    })
})

Addendum.prototype.arrive = cadence(function (async, request) {
    this._cubbyholes.set(request.body.government.promise, null, {
        nodes: JSON.parse(JSON.stringify(this.nodes)),
        index: this._index
    })
    return 200
})

Addendum.prototype.acclimated = cadence(function (async, request) {
    this._cubbyholes.remove(request.body.government.promise)
    return 200
})

Addendum.prototype.depart = cadence(function (async, request) {
    this._cubbyholes.remove(request.body.departed.promise)
    return 200
})

Addendum.prototype.receiveSet = cadence(function (async, request) {
    var envelope = request.body
    this.nodes[envelope.body.path] = {
        value: envelope.body.value,
        key: envelope.body.path,
        createdIndex: this._index,
        modifiedIndex: this._index
    }
    return 200
})

Addendum.prototype.reducedSet = cadence(function (async, request) {
    if (request.body.self.arrived == request.body.from.arrived) {
        this._cliffhanger.resolve(request.body.request.cookie, [ null, { action: 'set', value: request.body.request.value }])
    }
    return 200
})

// We always seem to be creating queues. Here's another one. It is implicit. We
// have a queue before we handle an incoming request. Our request is going to
// block until a message goes through the atomic log and a reduce message will
// cause use to return to the user. However, we also have an asynchronous
// request to our Compassion sidecar. We don't want to wait on both.
//
// Interesting case, though. Waiting on a larger operation that depends on the
// performance of smaller operations.

Addendum.prototype._broadcast = cadence(function (async, envelope) {
    async(function () {
        this._ua.fetch({
            url: this._compassionUrl
        }, {
            token: this._token,
            url: './broadcast',
            post: envelope.body,
            raise: true,
            parse: 'json'
        }, async())
    }, function () {
        return []
    })
})

Addendum.prototype.set = cadence(function (async, path, value) {
    this.broadcaster.push({
        method: 'set',
        message: {
            path: path,
            value: value,
            cookie: this._cliffhanger.invoke(async())
        }
    })
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
