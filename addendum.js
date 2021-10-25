const crypto = require('crypto')
const assert = require('assert')
const stream = require('stream')

// Return the first value that is not null-like.
const { coalesce } = require('extant')

const Cubbyhole = require('cubbyhole')
const Reactor = require('reactor')

const Conference = require('conference')

const { Calendar, Timer } = require('happenstance')

const { Future } = require('perhaps')

const rescue = require('rescue')

const Log = require('./log')
const WildMap = require('wildmap')

const AddendumError = require('./error')

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
        this.log = new Log(1000)
        this._wildmap = new WildMap
        this._wildmap.set([ '' ], { dir: true, node: { dir: true } })
        this._waiting = new WildMap
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
                body: { method: 'ttl', reset: false }
            })
        })
        this.conference = new Conference
        this.reactor = new Reactor([{
            path: '/',
            method: 'get',
            f: this.index.bind(this)
        }, {
            path: '/v2/keys',
            method: 'get',
            f: this.get.bind(this)
        }, {
            path: '/v2/keys/*',
            method: 'get',
            f: this.get.bind(this)
        }, {
            path: '/v2/keys/*',
            method: 'put',
            f: this.keys.bind(this)
        }, {
            path: '/v2/keys',
            method: 'put',
            f: this.root.bind(this)
        }, {
            path: '/v2/keys/*',
            method: 'delete',
            f: this.keys.bind(this)
        }, {
            path: '/v2/keys',
            method: 'delete',
            f: this.root.bind(this)
        }])
    }

    // The `initialize` method sets the Compassion object for this instance of
    // Addendum, a Compassion based application.
    initialize (compassion) {
        this.compassion = compassion
    }

    // Called after initialize when the instance is the first and only instance
    // of the consensus. Would perform any initialization but none is necessary
    // for Addendum.

    //
    async bootstrap () {
    }

    // Called when a new participant joins with the promise at which they
    // joined. We will already have received the arrive message for the new
    // instance and made a snapshot of the state of common data at the moment of
    // arrival prior to any modifications made by arrival.

    // We transmit the snapshot of the common data through an
    // [Avenue](https://github.com/bigeasy/avenue) queue. The Avenue queue
    // allows us to stream the snapshot data from this participant to the
    // joining participant.

    //
    async snapshot ({ queue, promise }) {
        queue.push(this._snapshots[promise].index)
        queue.push(this._snapshots[promise].nodes)
        queue.push(null)
    }

    // Called when a new participant after the the first participant arrives
    // with the other end of the queue from the `snapshot` side.

    //
    async join ({ shifter }) {
        this._index = await shifter.shift()
        for (const { key, value } of (await shifter.shift())) {
            this._wildmap.set(key, value)
        }
        this._nodes = await shifter.shift()
        await snapshot.shift()
    }

    // **TODO** `arrvial.promise` should be `arrival.arrived`.
    // When we have a new arrival we add its arrival promise to the `Conference`
    // so the `Conference` has an accurate census of participants. We then take
    // a snapshot of the current state of the application in case we're asked to
    // provide a snapshot for the new participant. Finally, we mark oursleves as
    // `ready` since the first arrival we receive will be for ourselves.

    //
    async arrive ({ arrival }) {
        this.conference.arrive(arrival.promise)
        this._snapshots[arrival.promise] = {
            nodes: this._wildmap.glob([ '', this._wildmap.recursive ])
                .map(key => ({ key, body: this._wildmap.get(key) }))
                .filter(({ key, body }) => ! body.dir)
                .map(({ key, body }) => ({ key: key.join('/'), value: body.value })),
            index: this._index
        }
        if (! this.ready.fulfilled) {
            this.ready.resolve(true)
        }
    }

    // We will get an acclimated message after an arriving participant has
    // received an arrival message for itself. At that point we can assume that
    // the participant has read its snapshot in `join` and performed any
    // additional initialization in the `arrive`. We delete the snapshot we took
    // in `arrive` since we will no longer need it.

    //
    async acclimated ({ promise }) {
        delete this._snapshots[promise]
    }

    // On departure we remove the participant from the `Conference` by the
    // arrival promise. When we remove it from the `Conference` we may trigger a
    // reduction, zero, one or more map/reduce calls may have been complete
    // except for this departing participant. We also delete any snapshot we
    // might be holding in case the participant departed before it acclimated.

    //
    async depart ({ departure }) {
        this.reduce(this.conference.depart(departure.promise))
        delete this._snapshots[departure.promise]
    }

    // When we get a new entry it is either a `"map"` message or a `"reduce"`
    // message.

    //
    async entry ({ promise, self, entry, from }) {
        switch (entry.method) {
        // Response to a message that has been enqueued by a specific
        // participant and requires an acknowledgement from all participants.
        case 'map': {
                try {
                    // We now switch on the specific message we want to map.
                    switch (entry.body.method) {
                    // The `"set"` message indicates that we want to set a key/value.
                    case 'set': {
                            // Create a path from the Fastify pattern match.
                            const path = `/${entry.body.path}`
                            // Create a key from the path.
                            const key = path.split('/')
                            // Ensure that the directory path is all directories or that it has
                            // not yet been created.
                            for (let i = 1, I = key.length; i < I; i++) {
                                const dir = key.slice(0, i)
                                const got = this._wildmap.get(dir)
                                if (got == null) {
                                    break
                                }
                                // 400 is Bad Request.
                                if (! got.dir) {
                                    throw new AddendumError(400, 104, dir.join('/'))
                                }
                            }
                            // What do we got there now?
                            const got = this._wildmap.get(key)
                            // We cannot overwrite a dir with a file.
                            if (got != null && got.dir != entry.body.dir && got.dir) {
                                throw new AddendumError(403, 102, key.join('/'))
                            }
                            // We can overwrite a file with a dir but not a dir with a dir.
                            if (got != null) {
                                if (got.dir && entry.body.dir) {
                                    throw new AddendumError(403, 102, key.join('/'))
                                }
                            }
                            // If we already have a ttl set for this key we need to notify the
                            // other participants that it is going to be reset.
                            const ttl = this.calendar.what(entry.body.path)
                            if (ttl != null) {
                                this.compassion.enqueue({ method: 'ttl', cookie: ttl.cookie, reset: true })
                            }
                            // If we have ttl in this set requeset, we schedule the timeout for
                            // the TTL and map a cookie so we can countdown all the timers or
                            // cancelations of all the participants before actually deleting.
                            if (entry.body.ttl != null) {
                                const cookie = `${entry.body.cookie}-ttl`
                                this.calendar.schedule(Date.now() + 1000 * entry.body.ttl, entry.body.path, { cookie })
                                this.conference.map(cookie, { method: 'ttl', key: key })
                            }
                            // Create our response message.
                            const index = this.log.length
                            const response = {
                                action: 'set',
                                node: {
                                    key: path,
                                    createdIndex: index,
                                    modifiedIndex: index
                                }
                            }
                            if (entry.body.dir) {
                                response.node.dir = entry.body.dir
                            } else {
                                response.node.value = entry.body.value
                            }
                            if (got != null) {
                                response.prevNode = got.node
                                response.node.createdIndex = response.prevNode.createdIndex
                            }
                            // Log the entry.
                            this.log.add(response)
                            const wildmap = this._wildmap
                            for (let i = 1, I = key.length; i != I; i++) {
                                const got = wildmap.get(key.slice(0, i))
                                if (got == null) {
                                    wildmap.set(key.slice(0, i), {
                                        dir: true,
                                        node: {
                                            key: key.slice(0, i).join('/'),
                                            dir: true,
                                            createdIndex: this.log.index,
                                            modifiedIndex: this.log.index
                                        }
                                    })
                                }
                            }
                            // Set the key.
                            wildmap.set(key, { dir: entry.body.dir, node: response.node })
                            // Do we have anyone waiting?
                            const waits = this._waiting.get(key) || []
                            if (waits != null) {
                                for (const wait of waits) {
                                    wait.through.write(JSON.stringify(response))
                                    wait.through.end()
                                }
                                this._waiting.unset(key)
                            }
                            for (let i = 1, I = key.length; i < I; i++) {
                                const waits = this._waiting.get(key.slice(0, i)) || []
                                for (let i = 0; i < waits.length;) {
                                    if (waits[i].recursive) {
                                        waits[i].through.write(JSON.stringify(response))
                                        waits[i].through.end()
                                        waits.splice(i, 1)
                                    } else {
                                        i++
                                    }
                                }
                                if (waits.length == 0) {
                                    this._waiting.unset(key.slice(0, 1))
                                }
                            }
                            // We want to map the set request and at the end of this function
                            // will will send a reduce message to let other participants know
                            // that we've received it so that the participant that accepted the
                            // HTTP request can send a response.
                            this.conference.map(entry.body.cookie, {
                                method: 'edit',
                                response: [ got == null ? 201 : 200, response, { 'X-Etcd-Index': this.log.index } ]
                            })
                        }
                        break
                    case 'delete': {
                            const index = this.log.length
                            const path = `/${entry.body.path}`
                            const response = {
                                action: 'delete',
                                node: {
                                    key: path,
                                    createdIndex: index,
                                    modifiedIndex: index
                                }
                            }
                            const key = path.split('/')
                            const got = this._wildmap.get(key)
                            if (got == null) {
                                throw this._404ed(key)
                            }
                            if (got != null && got.dir) {
                                if (! entry.body.recursive && ! entry.body.dir) {
                                    throw new AddendumError(403, 102, key.join('/'))
                                }
                                if (
                                    ! entry.body.recursive &&
                                    this._wildmap.glob(key.concat(this._wildmap.single)).length != 0
                                ) {
                                    throw new AddendumError(403, 108, key.join('/'))
                                }
                                response.node.dir = true
                            }
                            if (got != null) {
                                response.prevNode = got.node
                                response.node.createdIndex = response.prevNode.createdIndex
                            }
                            // Log the entry.
                            this.log.add(response)
                            // Remove the key.
                            this._wildmap.remove(key)
                            this.conference.map(entry.body.cookie, {
                                method: 'edit',
                                response: [ 200, response, { 'X-Etcd-Index': this.log.index }]
                            })
                        }
                        break
                    }
                } catch (error) {
                    rescue(error, [ AddendumError ])
                    this.conference.map(entry.body.cookie, {
                        method: 'edit',
                        response: error.response(this.log.index)
                    })
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
    //

    // You'll note that I'm using a lot of `switch`/`case` in this application.
    // It is my preference to see the logic layed out in this way. It is not
    // always thus. Compassion itself could simply be a queue of messages for
    // you to `switch` through, but I've organized those messages into a series
    // of events that can be documented through an interface.

    // But I have no qualms about `switch`/`case` and find it an appropriate
    // expression for message handling. Earlier I build map/reduce into
    // Compassion itself with a `map` and `reduce` function instead of `entry`,
    // but quickly found that it was at a different layer of abstraction. For
    // example, how do you reduce in response to the mapping or an arrival or
    // departure? Thus, entry now has nested `switch` statments inside a `"map"`
    // and `"reduce"`  `switch` allowing for the application that has a
    // as-of-yet developed notion of how to use an atomic log.

    // ---

    // We call this function with the result of `this.conference.reduce()` which
    // returns an array of "reductions," objects that contain a map value and an
    // object containing the reduce response from each of the participants.

    //
    reduce (reductions) {
        // For each reduction we switch on the name of the method in the mapped
        // object.
        for (const reduction of reductions) {
            switch (reduction.map.method) {
            // In the case of edit we look for a future that is the HTTP call
            // that is waiting on all of the participants to write the edit.
            // There will only be one participant that received the HTTP call so
            // there will be only one participant that has a future to resolve.
            case 'edit': {
                    const future = this._futures[reduction.key]
                    if (future != null) {
                        delete this._futures[reduction.key]
                        future.resolve(reduction.map.response)
                    }
                }
                break
            // In the case of TTL, every one of the participants has taken
            // action on a TTL setting for a key. Each participant has either
            // recieved a timer notification that a TTL has expired or else has
            // recieved a message to update the TTL or delete the key. Only if
            // all paritcipants have recived a timer notification do we delete
            // the key according to the TTL. If any participant tells us to
            // ignore the TTL because it reset it we do not delete the key.
            case 'ttl': {
                    if (! Conference.toArray(reduction).reduce((reset, reduction) => {
                        return reset || reduction.value.reset
                    }, false)) {
                        this._wildmap.remove(reduction.map.key)
                    }
                }
                break
            }
        }
    }

    // About TTL: in the above you can see how we handle a race condition using
    // the atomic log. If we have three participants and two have a TTL timer
    // fire for a key, but the third processes a `set` message that extends the
    // TTL timer, then we're going to have inconsistent state across the
    // mirrored state of the application.

    // The timer is outside of the atomic log and the participant could be at a
    // different point in atomic log processing when the timer fires.

    // We solve this using map/reduce and running the TTL deletion as a result
    // of a reduction. Every participant has to have inserted a timer expiration
    // into the atomic log. If a participant has processed a set or delete prior
    // to the timer firing it will reset the timer and enter a reset message
    // into the atomic log. The other participants will have logged timer
    // messages, but they will not have deleted the key. Thus when they see that
    // one of the participants has reset the TTL they ignore the TTL
    // reduction and the atomic log entry that reset the key for the one will
    // soon arrive for all and they will all maintain the same mirrored state.

    // ---

    index () {
        return 'Addendum API\n'
    }

    _404ed (key) {
        for (let i = 1, I = key.length; i != I; i++) {
            const got = this._wildmap.get(key.slice(0, i))
            if (got == null) {
                return new AddendumError(404, 100, key.slice(0, i).join('/'))
            }
        }
        return new AddendumError(404, 100, key.join('/'))
    }

    root () {
        return new AddendumError(400, 107, '/').response(this.log.index)
    }

    // When we have a get request we send the value of the current participant.
    // We do not run any messages through the atomic log. Your application may
    // require that reads be ordered as well as writes. It doesn't appear that
    // this is necessary for `etcd`.

    //
    get (request, reply) {
        const path = request.params['*'] == null ? '/' : `/${request.params['*']}`
        const key = path == '/' ? [ '' ] : path.split('/')
        // TODO Seems like wait index will skip a directory creation, whereas
        // long poll wait will not.
        if (request.query.waitIndex != null) {
            const waitIndex = parseInt(request.query.waitIndex, 10)
            const recursive = request.query.recursive == 'true'
            const found = this.log.find(waitIndex, recursive ? response => {
                return response.node.key == path || response.node.key.startsWith(`${path}/`)
            } : response => {
                return response.node.key == path
            })
            if (found.length != 0) {
                return [ 200, found[0], { 'X-Etcd-Index': this.log.index } ]
            }
        }
        // **TODO** Check that we have a decent path and what sort of errors we
        // get.
        if (request.query.wait == 'true') {
            const through = new stream.PassThrough({ emitClose: true })
            let got = this._waiting.get(key)
            if (got == null) {
                this._waiting.set(key, got = [])
            }
            got.push({ recursive: false, through: through })
            reply.code(200)
            reply.headers({
                'Connection': 'close',
                'Content-Type': 'application/json'
            })
            reply.send(through)
            return
        }
        const got = this._wildmap.get(key)
        if (got == null) {
            return this._404ed(key).response(this.log.index)
        }
        if (got.dir) {
            const recursive = request.query.recursive == 'true'
            const listing = this._wildmap.glob(key.concat(recursive ? this._wildmap.recursive : this._wildmap.single))
            if (listing.length == 0) {
                return [ 200, {
                    action: 'get',
                    node: got.node
                }, {
                    'X-Etcd-Index': this.log.index
                }]
            }
            if (recursive) {
                const sorted = listing.sort((left, right) => left.length - right.length)
                const tree = { children: {} }
                for (const key of sorted) {
                    let iterator = tree
                    for (let i = 1, I = key.length + 1; i < I; i++) {
                        const part = key[i - 1]
                        const node = this._wildmap.get(key.slice(0, i))
                        let child = iterator.children[part]
                        if (child == null) {
                            child = iterator.children[part] = { part, children: [], node }
                        }
                        iterator = child
                    }
                }
                let start = tree
                for (const part of key) {
                    start = start.children[part]
                }
                function descend (children) {
                    const gathered = []
                    for (const name in children) {
                        const child = children[name]
                        const node = { ...child.node.node }
                        const nodes = descend(child.children)
                        if (nodes.length != 0) {
                            node.nodes = nodes
                        }
                        gathered.push(node)
                    }
                    return gathered
                }
                const nodes = descend(start.children)
                if (nodes != null) {
                    return [ 200, {
                        action: 'get',
                        node: { ...got.node, nodes }
                    }, {
                        'X-Etcd-Index': this.log.index
                    } ]
                }
            }
            return {
                action: 'get',
                node: {
                    ...got.node,
                    nodes: listing.map(key => this._wildmap.get(key).node)
                }
            }
        }
        return {
            action: 'get',
            node: got.node
        }
    }

    // Our HTTP ingress for key requests. The request is enqueued into the
    // atomic log from the participant that handled the request in a `"map"`
    // message. These will be handled in the `entry` method above. We create a
    // Promise (Future wraps a Promise) to await the map/reduce. The reduce will
    // ensure that all participants have written the value.

    //
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
                        dir: body.dir == 'true',
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
                    body: {
                        method: 'delete',
                        dir: request.query.dir == 'true',
                        recursive: request.query.recursive == 'true',
                        path: key,
                        cookie
                    }
                })
                return future.promise
            }
        }
    }
}

module.exports = Addendum
