var cadence = require('cadence')
var logger = require('prolific.logger').createLogger('addendum')
var crypto = require('crypto')
var assert = require('assert')
var Cubbyhole = require('cubbyhole')
var Cliffhanger = require('cliffhanger')
var UserAgent = require('vizsla')

var Reactor = require('reactor')

function Addendum (compassionUrl) {
    this._nodes = {}
    this._index = 0
    this._cliffhanger = new Cliffhanger
    this._compassionUrl = compassionUrl
    this._cubbyholes = new Cubbyhole
    this._ua = new UserAgent
    this.reactor = new Reactor(this, function (dispatcher) {
        dispatcher.dispatch('GET /', 'index')
        dispatcher.dispatch('POST /register', 'register')
        dispatcher.dispatch('POST /arrive', 'arrive')
        dispatcher.dispatch('POST /acclimated', 'acclimated')
        dispatcher.dispatch('POST /join', 'join')
        dispatcher.dispatch('POST /backlog', 'backlog')
    })
}

Addendum.prototype.index = cadence(function (async) {
    return [ 200, { 'content-type': 'text/plain' }, 'Addendum Consensus API\n' ]
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
        this._nodes = body.nodes
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
        nodes: JSON.parse(JSON.stringify(this._nodes)),
        index: this._index
    })
    return 200
})

Addendum.prototype.acclimated = cadence(function (async, request) {
    this._cubbyholes.remove(request.body.government.promise)
    return 200
})

Addendum.prototype.exile = cadence(function (async, conference, id) {
    this._cubbys.remove(conference.government.exile.promise)
})

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
