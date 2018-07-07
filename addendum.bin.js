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
    var Destructible = require('destructible')
    var destructible = new Destructible('channel.bin')

    async([function () {
        destructible.destroy()
    }], [function () {
        program.helpIf(program.ultimate.help)

        program.required('local', 'public', 'compassion', 'island', 'id')
        program.validate(require('arguable/bindable'), 'public', 'local')

        program.on('shutdown', destructible.destroy.bind(destructible))

        destructible.completed.wait(async())

        var Addendum = require('./addendum')
        var Middleware = require('./middleware')

        var addendum = new Addendum(program.ultimate.compassion)
        var middleware = new Middleware(addendum)

        var http = require('http')
        var destroyer = require('server-destroy')
        var delta = require('delta')

        var UserAgent = require('vizsla')

        async(function () {
            var server = http.createServer(addendum.reactor.middleware)
            destroyer(server)
            destructible.destruct.wait(server, 'destroy')
            delta(destructible.monitor('local')).ee(server).on('close')
            program.ultimate.local.listen(server, async())
        }, function () {
            console.log('local')
            var server = http.createServer(middleware.reactor.middleware)
            destroyer(server)
            destructible.destruct.wait(server, 'destroy')
            delta(destructible.monitor('local')).ee(server).on('close')
            program.ultimate.public.listen(server, async())
        }, function () {
            console.log('public')
            var ua = new UserAgent
            ua.fetch({
                url: program.ultimate.compassion
            }, {
                url: '/register',
                timeout: 1000,
                post: {
                    token: '-',
                    island: 'addendum',
                    id: 'first',
                    url: 'http://127.0.0.1:' + program.ultimate.local.port + '/',
                    join: true,
                    arrive: true,
                    depart: true,
                    acclimated: true,
                    receive: [ 'set', 'remove' ],
                    reduced: [ 'set', 'remove' ]
                },
                parse: 'json',
                raise: true
            }, async())
        }, function () {
            console.log('registered')
            program.ready.unlatch()
            destructible.completed.wait(async())
        })
    }, function (error) {
        console.log(error.stack)
        program.ready.unlatch(error)
        throw error
    }])
}))
