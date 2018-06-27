require('proof')(2, require('cadence')(prove))

function prove (async, okay) {
    var bin = require('../addendum.bin'), program

    var Destructible = require('destructible')
    var destructible = new Destructible('t/addendum.bin')

    var UserAgent = require('vizsla')
    var ua = new UserAgent

    async([function () {
        destructible.destroy()
    }], function () {
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
    })
}
