require('proof')(4, require('cadence')(prove))

function prove (async, okay) {
    var Destructible = require('destructible')
    var destructible = new Destructible('t/consensus.t.js')

    var Addendum = require('../addendum')

    var http = require('http')
    var destroyer = require('server-destroy')
    var delta = require('delta')

    var UserAgent = require('vizsla')
    var ua = new UserAgent

    var Counterfeiter = require('compassion.counterfeiter')

    async([function () {
        destructible.completed.wait(async())
    }, function (error) {
        console.log(error.stack)
        throw error
    }])

    var addendums = {}

    async([function () {
        destructible.destroy()
    }], function () {
        destructible.monitor('counterfeiter', Counterfeiter, {
            ping: {
                application: 150,
                paxos: 150,
                chaperon: 150
            },
            timeout: {
                paxos: 450,
                chaperon: 450,
                http: 450
            }
        }, async())
    }, function (counterfeiter) {
        var events = counterfeiter.events.shifter()
        addendums.first = new Addendum('http://127.0.0.1:8386/')
        async(function () {
            var server = http.createServer(addendums.first.reactor.middleware)
            destroyer(server)
            destructible.destruct.wait(server, 'destroy')
            delta(destructible.monitor('first')).ee(server).on('close')
            server.listen(8081, '127.0.0.1', async())
        }, function () {
            ua.fetch({
                url: 'http://127.0.0.1:8386/register',
                timeout: 1000,
                post: {
                    token: '-',
                    island: 'addendum',
                    id: 'first',
                    url: 'http://127.0.0.1:8081/',
                    join: true,
                    arrive: true,
                    depart: true,
                    acclimated: true,
                    receive: [ 'set' ],
                    reduced: [ 'set' ]
                },
                parse: 'json',
                raise: true
            }, async())
            counterfeiter.events.shifter().join(function (event) {
                if (
                    event.type == 'consumed' &&
                    event.id == 'first' &&
                    event.body.promise == '1/0'
                ) {
                    return true
                }
                return false
            }, async())
        }, function () {
            okay(addendums.first._token != null, 'registered')
            ua.fetch({ url: 'http://127.0.0.1:8081/', parse: 'text', raise: true }, async())
        }, function (body) {
            okay(body, 'Addendum Consensus API\n', 'index')
            addendums.second = new Addendum('http://127.0.0.1:8386/')
            var server = http.createServer(addendums.second.reactor.middleware)
            destroyer(server)
            destructible.destruct.wait(server, 'destroy')
            delta(destructible.monitor('second')).ee(server).on('close')
            server.listen(8082, '127.0.0.1', async())
        }, function () {
            ua.fetch({
                url: 'http://127.0.0.1:8386/register',
                timeout: 1000,
                post: {
                    token: '-',
                    island: 'addendum',
                    id: 'second',
                    url: 'http://127.0.0.1:8082/',
                    join: true,
                    arrive: true,
                    depart: true,
                    acclimated: true,
                    receive: [ 'set' ],
                    reduced: [ 'set' ]
                },
                parse: 'json',
                raise: true
            }, async())
            counterfeiter.events.shifter().join(function (event) {
                if (
                    event.type == 'consumed' &&
                    event.id == 'second' &&
                    event.body.promise == '3/0'
                ) {
                    return true
                }
                return false
            }, async())
        }, function () {
            addendums.second.set('/path', 1, async())
        }, function (set) {
            okay(set, {
                action: 'set',
                node: {
                    createdIndex: 0,
                    modifiedIndex: 0,
                    path: '/path',
                    value: 1
                }
            }, 'set response')
            okay(addendums.second.nodes, {
                '/path': { value: 1, key: '/path', createdIndex: 0, modifiedIndex: 0 }
            }, 'set database')
            counterfeiter.events.shifter().join(function (event) {
                if (
                    event.type == 'consumed' &&
                    event.id == 'first' &&
                    event.body.promise == '4/0'
                ) {
                    return true
                }
                return false
            }, async())
            counterfeiter.terminate('addendum', 'second')
        })
    })
}
