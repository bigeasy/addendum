const crypto = require('crypto')
const assert = require('assert')

const Cubbyhole = require('cubbyhole')
const Reactor = require('reactor')

const Conference = require('conference')

const { Future } = require('perhaps')

/* Just a thought.
class Middleware extends Reactor {
    get = reaction('POST /get', async function ({ request }) {
        return 400
    })
}
*/

class Addendum {
    constructor () {
        this.ready = new Future
        this._nodes = {}
        this._index = 0
        this._cookie = 0n
        this._snapshots = {}
        this._futures = {}
        this._set = new Cubbyhole
        this.compassion = null
        this.conference = new Conference
        this.reactor = new Reactor([{
            path: '/',
            method: 'get',
            f: this.index.bind(this)
        }, {
            path: '/v2/keys/*',
            method: 'put',
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

    async entry ({ promise, self, entry, from }) {
        switch (entry.method) {
        case 'map': {
                switch (entry.body.method) {
                case 'set': {
                        const index = this._index++
                        this.conference.map(entry.body.cookie, this._nodes[entry.body.path] = {
                            action: 'set',
                            node: {
                                value: entry.body.value,
                                path: entry.body.path,
                                createdIndex: index,
                                modifiedIndex: index
                            },
                            prevNode: this._nodes[entry.body.path]
                        })
                    }
                    break
                case 'remove': {
                        const node = this._nodes[body.path]
                        delete this._nodes[body.path]
                        return { idnex: this._index++, prevNode: node }
                    }
                    break
                }
                this.compassion.enqueue({ method: 'reduce', cookie: entry.body.cookie })
            }
            break
        case 'reduce': {
                this.reduce(this.conference.reduce(self.arrived, entry.cookie, null))
            }
            break
        }
    }

    reduce (reductions) {
        for (const reduction of reductions) {
            const future = this._futures[reduction.key]
            if (future != null) {
                delete this._futures[reduction.key]
                future.resolve(reduction.map)
            }
        }
    }

    index () {
        return 'Addendum API\n'
    }

    keys (request, value) {
        const key = request.params['*']
        const body = request.body
        switch (request.method) {
        case 'PUT': {
                const cookie = `${this.compassion.id}/${this._cookie++}`
                const future = this._futures[cookie] = new Future
                this.compassion.enqueue({
                    method: 'map',
                    body: { method: 'set', path: key, value: body.value, cookie }
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
