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
                console.log(event)
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
            // The reason we need to wait a tick to exit is because we're
            // actually being called by the Paxos algorithm itself as it pushes
            // an event into it's log. That invokes the event handler in
            // Compassion's Conference object. The Compassion Conference object
            // is not going to do anything asynchronous with this version of our
            // tests because we've not registered any postbacks. When pushes the
            // event onto consume it will get here where here is just before the
            // `Destructile.destroy()` is called. `Destructible.destroy()` ruins
            // Paxos so it can't continue to operate when it comes back from
            // posting to it's log.
            console.log('WOULD DESTROY')
            setImmediate(async())
        })
    })
}
