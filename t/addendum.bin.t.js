require('proof')(3, require('cadence')(prove))

function prove (async, okay) {
    var bin = require('../addendum.bin'), program

    var http = require('http')

    var cadence = require('cadence')
    var destroyer = require('server-destroy')
    var delta = require('delta')

    var Reactor = require('reactor')

    var Destructible = require('destructible')
    var destructible = new Destructible('t/addendum.bin')

    var UserAgent = require('vizsla')
    var ua = new UserAgent

    var compassion = new Reactor({
        register: cadence(function (async) {
            return 200
        })
    }, function (dispatcher) {
        dispatcher.dispatch('/register', 'register')
    })

    async([function () {
        destructible.destroy()
    }], function () {
        var server = http.createServer(compassion.middleware)
        destroyer(server)
        destructible.destruct.wait(server, 'destroy')
        delta(destructible.monitor('compassion')).ee(server).on('end')
        server.listen(8386, async())
    }, function () {
        program = bin({
            public: 8080,
            local: 8086,
            compassion: 'http://127.0.0.1:8386/',
            island: 'addendum',
            id: 'first'
        }, async())
        async(function () {
            program.ready.wait(async())
        }, function () {
            ua.fetch({ url: 'http://127.0.0.1:8080/', parse: 'text' }, async())
        }, function (body) {
            okay(body, 'Addendum API\n', 'body')
            program.emit('SIGTERM')
        })
    }, function () {
        okay(true, 'done')
        program = bin({
            local: 8086,
            compassion: 'http://127.0.0.1:8386/',
            island: 'addendum',
            id: 'first'
        }, async())
        async([function () {
            program.ready.wait(async())
        }, function (error) {
            okay(error.key, 'public is required', 'required')
        }])
    })
}
