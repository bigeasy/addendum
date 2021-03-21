const crypto = require('crypto')
const assert = require('assert')

const Cubbyhole = require('cubbyhole')
const Reactor = require('reactor')

/* Just a thought.
class Middleware extends Reactor {
    get = reaction('POST /get', async function ({ request }) {
        return 400
    })
}
*/

class Addendum {
    constructor () {
        this.nodes = {}
        this._index = 0
        this._cubbyholes = new Cubbyhole
        this._set = new Cubbyhole
        this._client = null
        this.reactor = new Reactor([{
            path: '/',
            method: 'get',
            f: this.index.bind(this)
        }, {
            path: '/set',
            method: 'post',
            f: this.set.bind(this)
        }, {
            path: '/remove',
            method: 'post',
            f: this.remove.bind(this)
        }])
    }

    initialize (client) {
        this._client = client
    }

    async bootstrap () {
    }

    async join ({ snapshot }) {
        this._index = await snapshot.shift()
        this.nodes = await snapshot.shift()
        await snapshot.shift()
    }

    async arrive ({ arrival }) {
        this._cubbyholes.resolve(arrival.promise, null, {
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            index: this._index
        })
    }

    async acclimated ({ promise }) {
        this._cubbyholes.remove(promise)
    }

    async depart ({ departure }) {
        this._cubbyholes.remove(depatures.promise)
    }

    async map({ body }) {
        switch (body.method) {
        case 'set': {
                const index = this._index++
                this.nodes[body.path] = {
                    value: body.value,
                    path: body.path,
                    createdIndex: index,
                    modifiedIndex: index
                }
                return index
            }
        case 'remove': {
                const node = this.nodes[body.path]
                delete this.nodes[body.path]
                return { idnex: this._index++, prevNode: node }
            }
        }
    }

    async reduce ({ mapped }) {
        if (request.body.self.arrived == request.body.from.arrived) {
            switch (method) {
            case 'set': {
                    const index = mapped[from.arrived].index
                    this._cliffhanger.resolve(request.body.request.cookie, {
                        action: 'set',
                        node: {
                            createdIndex: index,
                            modifiedIndex: index,
                            path: request.body.request.path,
                            value: request.body.request.value
                        }
                    })
                }
                break
            case 'remove': {
                    const response = request.body.mapped[request.body.from.arrived]
                    const result = {
                        action: 'remove',
                        node: {
                            createdIndex: response.prevNode.createdIndex,
                            modifiedIndex: response.index,
                            path: request.body.request.path
                        }
                    }
                    if (response.prevNode != null) {
                        result.prevNode = {
                            createdIndex: response.prevNode.createdIndex,
                            modifiedIndex: response.prevNode.modifiedIndex,
                            path: response.prevNode.path,
                            value: response.prevNode.value
                        }
                    }
                    this._cliffhanger.resolve(request.body.request.cookie, result)
                }
                break
            }
        }
    }

    index () {
        return 'Addendum API\n'
    }

    async set (path, value) {
        const cookie = `${this.client.id}/${this._cookie++}`
        const future = this._futures[cookie] = new Future
        this.client.enqueue({ method: 'set', path, value })
        const result = await future.promise
        return result
    }

    async remove (path) {
        const cookie = `${this.client.id}/${this._cookie++}`
        const future = this._futures[cookie] = new Future
        this.client.enqueue({ method: 'remove', path })
        const result = await future.promise
        return result
    }
}

module.exports = Addendum
