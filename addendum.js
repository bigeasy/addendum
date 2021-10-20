const crypto = require('crypto')
const assert = require('assert')

// Return the first value that is not null-like.
const { coalesce } = require('extant')

const Cubbyhole = require('cubbyhole')
const Reactor = require('reactor')

const Conference = require('conference')

const { Calendar, Timer } = require('happenstance')

const { Future } = require('perhaps')

const Log = require('./log')

/* Just a thought.
class Middleware extends Reactor {
    get = reaction('POST /get', async function ({ request }) {
        return 400
    })
}
*/

class Addendum {
    constructor (destructible) {
        this.ready = new Future
        this._nodes = {}
        this.log = new Log(1000)
        this._index = 0
        this._cookie = 0n
        this._snapshots = {}
        this._futures = {}
        this._set = new Cubbyhole
        this.compassion = null
        this.calendar = new Calendar
        const timer = new Timer(this.calendar)
        destructible.destruct(() => timer.destroy())
        this.calendar.on('data', ({ key, body: { cookie }}) => {
            this.compassion.enqueue({
                method: 'reduce',
                cookie: cookie,
                body: { method: 'ttl', ignore: false }
            })
        })
        this.conference = new Conference
        this.reactor = new Reactor([{
            path: '/',
            method: 'get',
            raw: true,
            f: this.index.bind(this)
        }, {
            path: '/v2/keys/*',
            method: 'get',
            f: this.get.bind(this)
        }, {
            path: '/v2/keys/*',
            method: 'put',
            f: this.keys.bind(this)
        }, {
            path: '/v2/keys/*',
            method: 'delete',
            f: this.keys.bind(this)
        }])
    }

    initialize (compassion) {
        this.compassion = compassion
    }

    async bootstrap () {
    }

    async join ({ shifter }) {
        this._index = await shifter.shift()
        this._nodes = await shifter.shift()
        await snapshot.shift()
    }

    async snapshot ({ queue, promise }) {
        queue.push(this._snapshots[promise].index)
        queue.push(this._snapshots[promise].nodes)
        queue.push(null)
    }

    async arrive ({ arrival }) {
        this.conference.arrive(arrival.promise)
        this.ready.resolve(true)
        this._snapshots[arrival.promise] = {
            nodes: JSON.parse(JSON.stringify(this._nodes)),
            index: this._index
        }
    }

    async acclimated ({ promise }) {
        delete this._snapshots[promise]
    }

    async depart ({ departure }) {
        delete this._snapshots[departure.promise]
    }

    reduce (reductions) {
        for (const reduction of reductions) {
            switch (reduction.map.method) {
            case 'edit': {
                    const future = this._futures[reduction.key]
                    if (future != null) {
                        delete this._futures[reduction.key]
                        future.resolve(reduction.map.body)
                    }
                }
                break
            case 'ttl': {
                    if (! Conference.toArray(reduction).reduce((ignore, reduction) => {
                        return ignore || reduction.value.ignore
                    }, false)) {
                        delete this._nodes[reduction.map.key]
                    }
                }
                break
            }
        }
    }

    async entry ({ promise, self, entry, from }) {
        switch (entry.method) {
        case 'map': {
                switch (entry.body.method) {
                case 'set': {
                        const ttl = this.calendar.what(entry.body.path)
                        if (ttl != null) {
                            this.compassion.enqueue({ method: 'ttl', cookie: ttl.cookie, ignore: true })
                        }
                        if (entry.body.ttl != null) {
                            const cookie = `${entry.body.cookie}-ttl`
                            this.calendar.schedule(Date.now() + 1000 * entry.body.ttl, entry.body.path, { cookie })
                            this.conference.map(cookie, { method: 'ttl', key: entry.body.path })
                        }
                        const index = this.log.length
                        const response = {
                            action: 'set',
                            node: {
                                value: entry.body.value,
                                key: '/' + entry.body.path,
                                createdIndex: index,
                                modifiedIndex: index
                            }
                        }
                        if (entry.body.path in this._nodes) {
                            response.prevNode = this._nodes[entry.body.path].node
                            response.node.createdIndex = response.prevNode.createdIndex
                        }
                        this.conference.map(entry.body.cookie, {
                            method: 'edit',
                            body: this._nodes[entry.body.path] = this.log.add(response)
                        })
                    }
                    break
                case 'delete': {
                        const index = this.log.length
                        const response = {
                            action: 'delete',
                            node: {
                                value: entry.body.value,
                                key: '/' + entry.body.path,
                                createdIndex: index,
                                modifiedIndex: index
                            }
                        }
                        if (entry.body.path in this._nodes) {
                            response.prevNode = this._nodes[entry.body.path].node
                            response.node.createdIndex = response.prevNode.createdIndex
                        }
                        delete this._nodes[entry.body.path]
                        this.conference.map(entry.body.cookie, {
                            method: 'edit',
                            body: this.log.add(response)
                        })
                    }
                    break
                }
                this.compassion.enqueue({ method: 'reduce', cookie: entry.body.cookie, body: null })
            }
            break
        case 'reduce': {
                this.reduce(this.conference.reduce(entry.cookie, self.arrived, entry.body))
            }
            break
        }
    }

    index () {
        return 'Addendum API\n'
    }

    get (request, reply) {
        const key = request.params['*']
        const node = this._nodes[key]
        if (node == null) {
            reply.code(404)
            reply.send({
                errorCode:100,
                message: 'Key not found',
                cause: '/' + key,
                index: this.log.index
            })
        } else {
            return {
                action: 'get',
                node: node
            }
        }
    }

    keys (request) {
        const key = request.params['*']
        const body = request.body
        switch (request.method) {
        case 'PUT': {
                const cookie = `${this.compassion.id}/${this._cookie++}`
                const future = this._futures[cookie] = new Future
                this.compassion.enqueue({
                    method: 'map',
                    body: {
                        method: 'set',
                        path: key,
                        value: body.value,
                        ttl: coalesce(body.ttl),
                        cookie
                    }
                })
                return future.promise
            }
        case 'DELETE': {
                const cookie = `${this.compassion.id}/${this._cookie++}`
                const future = this._futures[cookie] = new Future
                this.compassion.enqueue({
                    method: 'map',
                    body: { method: 'delete', path: key, cookie }
                })
                return future.promise
            }
        }
    }

    remove (path) {
        const cookie = `${this.client.id}/${this._cookie++}`
        const future = this._futures[cookie] = new Future
        this.compassion.enqueue({ method: 'remove', path, cookie })
        return future.promise
    }
}

module.exports = Addendum
