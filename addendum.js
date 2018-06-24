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
        dispatcher.dispatch('POST /receive/remove', 'receiveRemove')
        dispatcher.dispatch('POST /reduced/remove', 'reducedRemove')
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
    var index = this._index++
    this.nodes[envelope.body.path] = {
        value: envelope.body.value,
        path: envelope.body.path,
        createdIndex: index,
        modifiedIndex: index
    }
    return { index: index }
})

Addendum.prototype.reducedSet = cadence(function (async, request) {
    if (request.body.self.arrived == request.body.from.arrived) {
        var index = request.body.mapped[request.body.from.arrived].index
        this._cliffhanger.resolve(request.body.request.cookie, [ null, {
            action: 'set',
            node: {
                createdIndex: index,
                modifiedIndex: index,
                path: request.body.request.path,
                value: request.body.request.value
            }
        }])
    }
    return 200
})

Addendum.prototype.receiveRemove = cadence(function (async, request) {
    var envelope = request.body
    var node = this.nodes[envelope.body.path]
    delete this.nodes[envelope.body.path]
    return { index: this._index++, prevNode: node }
})

Addendum.prototype.reducedRemove = cadence(function (async, request) {
    if (request.body.self.arrived == request.body.from.arrived) {
        var response = request.body.mapped[request.body.from.arrived]
        var result = {
            action: 'remove',
            node: {
                createdIndex: response.prevNode.createdIndex,
                modifiedIndex: response.index,
                path: request.body.request.path
            }
        }
        if (response.prevNode != null) {
            result.prevNode = {
                createdIndex: response.prevNode.createdIndex,
                modifiedIndex: response.prevNode.modifiedIndex,
                path: response.prevNode.path,
                value: response.prevNode.value
            }
        }
        this._cliffhanger.resolve(request.body.request.cookie, [ null, result ])
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

Addendum.prototype.remove = cadence(function (async, path) {
    this.broadcaster.push({
        method: 'remove',
        message: {
            path: path,
            cookie: this._cliffhanger.invoke(async())
        }
    })
})

module.exports = Addendum
