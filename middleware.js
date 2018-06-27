var cadence = require('cadence')
var Reactor = require('reactor')

function Middleware (addendum) {
    this._addendum = addendum
    this.reactor = new Reactor(this, function (dispatcher) {
        dispatcher.dispatch('/', 'index')
    })
}

Middleware.prototype.index = cadence(function (async) {
    return [ 200, { 'content-type': 'text/plain' }, 'Addendum API\n' ]
})

module.exports = Middleware
