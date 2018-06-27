require('proof')(1, require('cadence')(prove))

function prove (async, okay) {
    var Middleware = require('../middleware')
    var middleware = new Middleware({
        get: function () {},
        remove: function () {}
    })
    var UserAgent = require('vizsla')
    var Interlocutor = require('interlocutor')
    var ua = new UserAgent().bind({
        http: new Interlocutor(middleware.reactor.middleware),
        url: 'http://127.0.0.1:8080/'
    })
    async(function () {
        ua.fetch({ url: '/', parse: 'text' }, async())
    }, function (body) {
        okay(body, 'Addendum API\n', 'index')
    })
}
