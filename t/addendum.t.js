require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Addendum = require('../addendum')

    var http = require('http')
    var delta = require('delta')

    var UserAgent = require('vizsla')
    var Cliffhanger = require('cliffhanger')

    var nodes = {}
    var cliffhanger = new Cliffhanger

    var addendum = new Addendum(cliffhanger, nodes)

    var Destructible = require('destructible')
    var destructible = new Destructible('t/addendum.t.js')

    var ua = new UserAgent

    async([function () {
        destructible.destroy()
    }], function () {
        var server = http.createServer(addendum.reactor.middleware)
        server.listen(8081, '127.0.0.1', async())
        destructible.destruct.wait(server, 'close')
        delta(destructible.monitor('http')).ee(server).on('close')
    }, function () {
        ua.fetch({ url: 'http://127.0.0.1:8081/', parse: 'text', raise: true }, async())
    }, function (body) {
        okay(body, 'Addendum Consensus API\n', 'index')
    })
}
