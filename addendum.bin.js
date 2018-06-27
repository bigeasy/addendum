#!/usr/bin/env node

/*
    ___ usage ___ en_US ___
    usage: addendum <args>

        --help
            display this message

        --public <string>
            address and port to bind to

        --local <string>
            address and port to bind to for local API

        --compassion <string>
            url of compassion local api

        --island <string>
            compassion island

        --id <string>
            compassion id
    ___ $ ___ en_US ___
    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program) {
    program.helpIf(program.ultimate.help)

    program.required('local', 'public', 'compassion', 'island', 'id')
    program.validate(require('arguable/bindable'), 'public', 'local')

    var Destructible = require('destructible')
    var destructible = new Destructible('channel.bin')

    program.on('shutdown', destructible.destroy.bind(destructible))

    destructible.completed.wait(async())

    var Addendum = require('./addendum')
    var Middleware = require('./middleware')

    var addendum = new Addendum(program.ultimate.compassion)
    var middleware = new Middleware(addendum)

    var http = require('http')
    var destroyer = require('server-destroy')
    var delta = require('delta')

    async([function () {
        destructible.destroy()
    }], function () {
        var server = http.createServer(addendum.reactor.middleware)
        destroyer(server)
        destructible.destruct.wait(server, 'destroy')
        delta(destructible.monitor('local')).ee(server).on('close')
        program.ultimate.local.listen(server, async())
    }, function () {
        var server = http.createServer(middleware.reactor.middleware)
        destroyer(server)
        destructible.destruct.wait(server, 'destroy')
        delta(destructible.monitor('local')).ee(server).on('close')
        program.ultimate.public.listen(server, async())
    }, function () {
        program.ready.unlatch()
        destructible.completed.wait(async())
    })
}))
