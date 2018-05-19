require('proof')(1, require('cadence')(prove))

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
        destructible.monitor('counterfeiter', Counterfeiter, {}, async())
    }, function (counterfeiter) {
        var events = counterfeiter.events.shifter()
        addendums.first = new Addendum
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
                    url: 'http://127.0.0.1:8081/'
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
        }, function () {
            // To exit without error we need to give the consensus algorithm a
            // moment to follow through on its network communication.
            // TODO Remove and gracefully scram on `destroy`.
            setTimeout(async(), 250)
        })
    })
}
