const crypto = require('crypto')
const assert = require('assert')
const stream = require('stream')

// **TODO** You can probably collapse the nodes in the wild map. You don't need
// them to be nested. You thought you'd be adding wait properties to the node
// but you're tracking that in a different map.

// Return the first value that is not null-like.
const { coalesce } = require('extant')

// Shorthand for binding HTTP verbs to class methods.
const Reactor = require('reactor')

const Conference = require('conference')

// Comparator function builder.
const ascension = require('ascension')

// A comparator decorator that extracts values for comparison.
const whittle = require('whittle')

// An event scheduler to manage multiple timed events inside a calendar using a
// single `setTimeout`.
const { Calendar, Timer } = require('happenstance')

// A future wrapper around a Promise.
const { Future } = require('perhaps')

// Conditionally catch a JavaScript exception based on type and properties.
const rescue = require('rescue')

// A map keyed by path with wildcard matching.
const WildMap = require('wildmap')

// Log of messages for wait index playback.
const Log = require('./log')

const AddendumError = require('./error')

const sort = whittle(ascension(String), node => node.key)

// Compassion applications are implemented as a class that implements a specific
// interface of `async`/`await` functions. Addendum is an implementation of the
// `etcd` v2 API using Compassion. With it you'll be able to see how you might
// go about building a consensus application using an atomic log.

//
class Addendum {
    constructor (destructible) {
        // We trip promise this when we are ready to receive messages.
        this.ready = new Future
        // Our change log with 1000 entries according to `etcd` docs.
        this.log = new Log(1000)
        // Our tree of keys.
        this._wildmap = new WildMap
        // The root key is read-only and has no version (index) information.
        this._wildmap.set([ '' ], { dir: true })
        // Our tree of long polling waits for changes.
        this._waiting = new WildMap
        // **TOOD** This is wrong. We need snapshot and join inside the log.
        this._index = 0
        // A cookie used to map promises waiting on the atomic log. We map
        // promises to these cookies and resolve the promises when the logged
        // processing has completed.
        this._cookie = 0n
        // Our map of cookies to awaiting HTTP response promises.
        this._futures = {}
        // A map of snapshots of the application state indexed by the arrival
        // promise of a new participant. We make a snapshot when we see an
        // arrival and if we are the leader the new arrival will ask for the
        // snapshot through the `snapshot` method. (TODO Maybe move these words
        // to the snapshot method.)
        this._snapshots = {}
        // The compassion object set on initialize.
        this.compassion = null
        // A calendar used to schedule timed events, specifically the `ttl`
        // expiration of keys.
        this.calendar = new Calendar
        // We have to wrap the calendar in a timer that will manage a single
        // `setTimeout` for the next scheduled event in the calendar.
        const timer = new Timer(this.calendar)
        // Destroy the timer when the application is destroyed.
        destructible.destruct(() => timer.destroy())
        // When the calendar fires an event we enqueue a `ttl` message. This is
        // a reduce message, so only when a `ttl` message is received from every
        // member and all of the messages have `reset` as `false` will the key
        // be deleted. Timers will fire arbitrarily, but by running this
        // countdown through the atomic log we ensure that all of the
        // TTL deletions occur in the same order.
        this.calendar.on('data', ({ key, body: { cookie }}) => {
            this.compassion.enqueue({
                method: 'reduce',
                cookie: cookie,
                body: { method: 'ttl', reset: false }
            })
        })
        // Our map/reduce utility that will map a message and then countdown the
        // responses from each participant as well as account for arriving and
        // departing participants.
        this.conference = new Conference
        // The `etc` HTTP interface. We map the `etcd` HTTP API to `async`
        // methods on this class, so this class implements both the Compassion
        // API and the HTTP API.
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
            path: '/v2/keys/*',
            method: 'post',
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

    //
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

    // Called when a new participant after the first participant arrives with
    // the other end of the queue from the `snapshot` side.

    //
    async join ({ shifter }) {
        this._index = await shifter.shift()
        for (const { key, value } of (await shifter.shift())) {
            this._wildmap.set(key, value)
        }
        this._nodes = await shifter.shift()
        await snapshot.shift()
    }

    // **TODO** `arrival.promise` should be `arrival.arrived`.

    //

    // When we have a new arrival we add its arrival promise to the `Conference`
    // so the `Conference` has an accurate census of participants. We then take
    // a snapshot of the current state of the application in case we're asked to
    // provide a snapshot for the new participant. Finally, we mark ourselves as
    // `ready` since the first arrival we receive will be for ourselves.

    //
    async arrive ({ arrival }) {
        this.conference.arrive(arrival.promise)
        this._snapshots[arrival.promise] = {
            nodes: this._wildmap.glob([ '', this._wildmap.recursive ])
                .map(key => ({ key, value: this._wildmap.get(key) }))
                .filter(({ key, value }) => ! body.dir)
                .map(({ key, body }) => ({ key: key.join('/'), value })),
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
        // This is essentially map/reduce and we use `Conference` to implement
        // the map/reduce accounting.

        // Note that we don't just make note of the arrival with a call to
        // `Conference.map`. We actually build out our response and map that.
        // Because our logic is deterministic and every participant is
        // receiving the same entries in the same order, all participants will
        // build the same response for each entry. We then use
        // `Compassion.reduce` to determine when all participants have received
        // the message and only then to we send an HTTP response to the caller.

        //
        case 'map': {
                // For the `map` case we use a try/catch block and a special
                // exception. We can throw an exception from anywhere and that
                // exception will format the appropriate error response and map it
                // using `Conference.map`.

                //
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
                            // We cannot overwrite a dir
                            if (got != null && got.dir) {
                                throw new AddendumError(403, 102, key.join('/'))
                            }
                            // If we already have a TTL set for this key we need to notify the
                            // other participants that it is going to be reset. This will
                            // cancel the `ttl` deletion even if other participants have had
                            // their timers fire and have enqueued a `ttl` timeout because
                            // `reset` must by unanimously false.
                            //
                            // **TODO** Obviously broken because there is no `'reduce'`
                            // envelope. How do we unit test this?
                            const ttl = this.calendar.what(entry.body.path)
                            if (ttl != null) {
                                this.compassion.enqueue({ method: 'ttl', cookie: ttl.cookie, reset: true })
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
                            // If we have TTL in this set request, we schedule the timeout for
                            // the TTL and map a cookie so we can countdown all the timers or
                            // cancellations of all the participants before actually deleting.
                            if (entry.body.ttl != null) {
                                const cookie = `${entry.body.cookie}-ttl`
                                const when = Date.now() + 1000 * +entry.body.ttl
                                response.node.expiration = new Date(when).toISOString()
                                response.node.ttl = +entry.body.ttl
                                this.calendar.schedule(when, entry.body.path, { cookie })
                                this.conference.map(cookie, { method: 'ttl', key: key })
                            }
                            // If we had a value, set the previous node property.
                            if (got != null) {
                                response.prevNode = got
                                response.node.createdIndex = response.prevNode.createdIndex
                            }
                            // File and directory nodes have different properties.
                            if (entry.body.dir) {
                                response.node.dir = true
                            } else {
                                response.node.value = entry.body.refresh ? got.value : entry.body.value
                            }
                            // If this is both a `refresh` with a `prevExist` then the action is
                            // update and we should not trigger any waits.
                            if (entry.body.refresh && entry.body.prevExist) {
                                response.action = 'update'
                            }
                            // If we have a previous value parameter this is a compare and set.
                            if (
                                entry.body.prevValue != null
                            ) {
                                if (
                                    // **TODO** got is null
                                    // **TODO** got is dir
                                    // **TODO** we have no refresh stuff set
                                    entry.body.prevValue != got.value
                                ) {
                                    throw new AddendumError(412, 101, `[${entry.body.prevValue} != ${got.value}]`)
                                }
                                response.action = 'compareAndSwap'
                            }
                            // Log the entry.
                            this.log.add(response)
                            // **TODO** if (response.action != 'update') {
                            // Ensure that there is a path of directories to the key, creating
                            // any directories that are missing. Note that we checked above to
                            // ensure that there is not a file in the path.
                            for (let i = 1, I = key.length; i != I; i++) {
                                const got = this._wildmap.get(key.slice(0, i))
                                if (got == null) {
                                    this._wildmap.set(key.slice(0, i), {
                                        key: key.slice(0, i).join('/'),
                                        dir: true,
                                        createdIndex: this.log.index,
                                        modifiedIndex: this.log.index
                                    })
                                }
                            }
                            // Set the key.
                            this._wildmap.set(key, response.node)
                            // Do we have anyone waiting? Notify any GET requests waiting on
                            // change notifications.
                            this.notify(key, response)
                            // Here we call `map`. Might seem strange, to me at least, to call
                            // last thing, but it's fine really. This is the response we'll send
                            // to the HTTP client if we're the participant that accepted the
                            // request.
                            this.conference.map(entry.body.cookie, {
                                method: 'edit',
                                response: [ got == null ? 201 : 200, response, { 'X-Etcd-Index': this.log.index } ]
                            })
                        }
                        break
                    // The `'create'` message indicates that we want to create an
                    // automatic key in a directory.
                    case 'create': {
                            // Create a path from the Fastify pattern match.
                            const path = `/${entry.body.path}`
                            // Create a key from the path.
                            const key = path.split('/')
                            // If the key does not exist 404.
                            const got = this._wildmap.get(key)
                            if (got == null) {
                                throw this._404ed(key)
                            }
                            // Get the next index.
                            const index = this.log.length
                            // Create our generated key.
                            const create = `${path}/${String(index).padStart(20, '0')}`.split('/')
                            // Create the response.
                            const response = {
                                action: 'create',
                                node: {
                                    key: create.join('/'),
                                    value: entry.body.value,
                                    createdIndex: index,
                                    modifiedIndex: index
                                }
                            }
                            // Log the entry.
                            this.log.add(response)
                            // Set the key.
                            this._wildmap.set(create, response.node)
                            this.conference.map(entry.body.cookie, {
                                method: 'edit',
                                response: [ 201, response, { 'X-Etcd-Index': this.log.index }]
                            })
                        }
                        break
                    // The `'get'` message indicates a quorum get.
                    case 'get': {
                            // Get the key value.
                            const got = this._wildmap.get(entry.body.params.key)
                            // If the key does not exist 404.
                            if (got == null) {
                                throw this._404ed(entry.body.param.key)
                            }
                            // Create the response.
                            const response = { action: 'get', node: got }
                            this.conference.map(entry.body.cookie, {
                                method: 'edit',
                                response: [ 200, response, { 'X-Etcd-Index': this.log.index } ]
                            })
                        }
                        break
                    // The `'delete'` message indicates that we want to delete a key/value.
                    case 'delete': {
                            // Create a path from the Fastify pattern match.
                            const path = `/${entry.body.path}`
                            // Create a key from the path.
                            const key = path.split('/')
                            // If the key does not exist 404.
                            const got = this._wildmap.get(key)
                            if (got == null) {
                                throw this._404ed(key)
                            }
                            // Create a response structure.
                            const index = this.log.length
                            const response = {
                                action: 'delete',
                                node: {
                                    key: path,
                                    createdIndex: index,
                                    modifiedIndex: index
                                }
                            }
                            // If we have a previous value...
                            if (got != null) {
                                // If the value is a directory...
                                if (got.dir) {
                                    // Check that the user asked to delete a directory or to delete
                                    // recursively, otherwise we error with "not a directory."
                                    if (! entry.body.recursive && ! entry.body.dir) {
                                        throw new AddendumError(403, 102, key.join('/'))
                                    }
                                    // If the delete is not recursive and there are items in the
                                    // directory throw "directory not empty."
                                    if (
                                        ! entry.body.recursive &&
                                        this._wildmap.glob(key.concat(this._wildmap.single)).length != 0
                                    ) {
                                        throw new AddendumError(403, 108, key.join('/'))
                                    }
                                    // Mark response as a directory.
                                    response.node.dir = true
                                }
                                // Add the previous value node to the response.
                                response.prevNode = got
                                response.node.createdIndex = response.prevNode.createdIndex
                            }
                            // If we have a previous value parameter this is a compare and
                            // delete.
                            if (entry.body.prevValue != null) {
                                if (got.value != entry.body.prevValue) {
                                    throw new AddendumError(412, 101, `[${entry.body.prevValue} != ${got.value}]`)
                                }
                                response.action = 'compareAndDelete'
                            }
                            // Log the entry.
                            this.log.add(response)
                            // Do we have anyone waiting? Notify any GET requests waiting on
                            // change notifications.
                            this.notify(key, response)
                            // Remove the key.
                            this._wildmap.remove(key)
                            // Here we call `map`. Might seem strange, to me at least, to call
                            // last thing, but it's fine really. This is the response we'll send
                            // to the HTTP client if we're the participant that accepted the
                            // request.
                            this.conference.map(entry.body.cookie, {
                                method: 'edit',
                                response: [ 200, response, { 'X-Etcd-Index': this.log.index }]
                            })
                        }
                        break
                    }
                } catch (error) {
                    // If the exception is not an exception specific to our application,
                    // `rescue` will rethrow the exception.
                    rescue(error, [ AddendumError ])
                    // Our exception is one of the expected error conditions. Format the
                    // HTTP error response with code, headers and body.
                    this.conference.map(entry.body.cookie, {
                        method: 'edit',
                        response: error.response(this.log.index)
                    })
                }
                // Enqueue a reduce message to indicate that we've received and
                // processed the message.
                this.compassion.enqueue({ method: 'reduce', cookie: entry.body.cookie, body: null })
            }
            break
        // For `'reduce'` we call our `Conference.reduce`. It keeps a tally of
        // the reduce messages for a specific message mapped by the cookie. If
        // we have a reduce message from all participants it returns an array
        // containing one map message and a set reduce message one for each
        // participant. If we do not have all the reduce messages yet it returns
        // an empty array.

        //
        case 'reduce': {
                this.reduce(this.conference.reduce(entry.cookie, self.arrived, entry.body))
            }
            break
        }
    }

    // Do we have anyone waiting? Called for both `'set'` and `'delete'`
    // messages in the `'map'` section of the `entry` method above.

    // The wild map is keyed on a key path and the value is an array of waits
    // which is a `recursive` flag and a Node.js `stream` which serves the body
    // of a GET request. The client is blocking on the completion of the GET
    // request.

    // When a wait is notified it is removed from the wild map. We're completing
    // an HTTP GET request so the wait has been consumed.

    //
    notify (key, response) {
        // We look in our wait wild map for the set of waits specific to the
        // key. All of those waits are notified with the response.
        const waits = this._waiting.get(key)
        if (waits != null) {
            for (const wait of waits) {
                wait.through.write(JSON.stringify(response))
                wait.through.end()
            }
            this._waiting.unset(key)
        }
        // We go up the key path looking for the set of waits for each
        // directory in the path. If any of those waits is recursive it is
        // notified of the response.
        for (let i = 1, I = key.length; i < I; i++) {
            const waits = this._waiting.get(key.slice(0, i))
            if (waits != null) {
                for (let j = 0; j < waits.length;) {
                    if (waits[j].recursive) {
                        waits[j].through.write(JSON.stringify(response))
                        waits[j].through.end()
                        waits.splice(j, 1)
                    } else {
                        j++
                    }
                }
                if (waits.length == 0) {
                    this._waiting.unset(key.slice(0, 1))
                }
            }
        }
    }
    //

    // You'll note that I'm using a lot of `switch`/`case` in this application.
    // It is my preference to see the logic laid out in this way. It is not
    // always thus. Compassion itself could simply be a queue of messages for
    // you to `switch` through, but I've organized those messages into a series
    // of events that can be documented through an interface.

    // But I have no qualms about `switch`/`case` and find it an appropriate
    // expression for message handling. Earlier I build map/reduce into
    // Compassion itself with a `map` and `reduce` function instead of `entry`,
    // but quickly found that it was at a different layer of abstraction. For
    // example, how do you reduce in response to the mapping or an arrival or
    // departure? Thus, entry now has nested `switch` statements inside a `"map"`
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
            // received a timer notification that a TTL has expired or else has
            // received a message to update the TTL or delete the key. Only if
            // all participants have received a timer notification do we delete
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

    _got (request) {
        const path = request.params['*'] == null ? '/' : `/${request.params['*']}`
        const key = path == '/' ? [ '' ] : path.split('/')
        const quorum = request.query.quorum == 'true'
        const wait = request.query.wait == 'true'
        const recursive = request.query.recursive == 'true'
        const waitIndex = request.query.waitIndex == null ? null : parseInt(request.query.waitIndex, 10)
        const sorted = request.query.sorted == 'true'
        return { path, key, quorum, wait, waitIndex, recursive, sorted }
    }

    _get (params) {
        const got = this._wildmap.get(params.key)
        if (got == null) {
            return this._404ed(params.key).response(this.log.index)
        }
        if (got.dir) {
            const listing = this._wildmap.glob(params.key.concat(params.recursive ? this._wildmap.recursive : this._wildmap.single))
            if (listing.length == 0) {
                return [ 200, {
                    action: 'get',
                    node: got
                }, {
                    'X-Etcd-Index': this.log.index
                }]
            }
            if (params.recursive) {
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
                for (const part of params.key) {
                    start = start.children[part]
                }
                function descend (children) {
                    const gathered = []
                    for (const name in children) {
                        const child = children[name]
                        const node = { ...child.node }
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
                        node: { ...got, nodes }
                    }, {
                        'X-Etcd-Index': this.log.index
                    } ]
                }
            }
            const sorted = listing.map(key => this._wildmap.get(key))
            if (params.sorted) {
                listing.sort(sort)
            }
            return {
                action: 'get',
                node: {
                    ...got,
                    nodes: sorted
                }
            }
        }
        return this._response(200, { action: 'get', node: got })
    }

    _response (code, body) {
        return [ 200, body, { 'X-Etcd-Index': this.log.index } ]
    }

    // When we have a get request we send the value of the current participant.
    // We do not run any messages through the atomic log. Your application may
    // require that reads be ordered as well as writes. It doesn't appear that
    // this is necessary for `etcd`.

    //
    get (request, reply) {
        const params = this._got(request)
        // **TODO** What if there is `wait` and `waitIndex`?
        if (params.quorum) {
            const cookie = `${this.compassion.id}/${this._cookie++}`
            const future = this._futures[cookie] = new Future
            this.compassion.enqueue({
                method: 'map',
                body: {
                    method: 'get',
                    params: params,
                    cookie
                }
            })
            return future.promise
        }
        // TODO Seems like wait index will skip a directory creation, whereas
        // long poll wait will not.
        // **TODO** Check that we have a decent path and what sort of errors we
        // get.
        if (params.wait) {
            if (params.waitIndex != null) {
                const found = this.log.find(params.waitIndex, params.recursive ? response => {
                    return response.node.key.startsWith(`${params.path}/`)
                    return response.node.key == params.path || response.node.key.startsWith(`${params.path}/`)
                } : response => {
                    return response.node.key == params.path
                })
                if (found.length != 0) {
                    return [ 200, found[0], { 'X-Etcd-Index': this.log.index } ]
                }
            }
            const through = new stream.PassThrough({ emitClose: true })
            let wait = this._waiting.get(params.key)
            if (wait == null) {
                this._waiting.set(params.key, wait = [])
            }
            wait.push({ recursive: params.recursive, through: through })
            reply.code(200)
            reply.headers({
                'Connection': 'close',
                'Content-Type': 'application/json'
            })
            reply.send(through)
            return
        }
        return this._get(params)
    }

    // Our HTTP ingress for key requests. The request is enqueued into the
    // atomic log from the participant that handled the request in a `"map"`
    // message. These will be handled in the `entry` method above. We create a
    // Promise (a Future wraps a Promise) to await the map/reduce. The reduce
    // will ensure that all participants have written the value.

    // As you can see, this method merely converts the HTTP request into a
    // message that is enqueued into Paxos. It then waits on future that will be
    // triggered when the mapped request reduces.

    //
    keys (request) {
        const key = request.params['*']
        const body = request.body
        const cookie = `${this.compassion.id}/${this._cookie++}`
        const future = this._futures[cookie] = new Future
        switch (request.method) {
        case 'POST': {
                this.compassion.enqueue({
                    method: 'map',
                    body: {
                        method: 'create',
                        path: key,
                        value: body.value,
                        prevValue: coalesce(request.query.prevValue),
                        refresh: body.refresh == 'true',
                        prevExist: body.prevExist == 'true',
                        ttl: coalesce(body.ttl),
                        dir: body.dir == 'true',
                        cookie
                    }
                })
                return future.promise
            }
        case 'PUT': {
                this.compassion.enqueue({
                    method: 'map',
                    body: {
                        method: 'set',
                        path: key,
                        value: body.value,
                        prevValue: coalesce(request.query.prevValue),
                        refresh: body.refresh == 'true',
                        prevExist: body.prevExist == 'true',
                        ttl: coalesce(body.ttl),
                        dir: body.dir == 'true',
                        cookie
                    }
                })
                return future.promise
            }
        case 'DELETE': {
                this.compassion.enqueue({
                    method: 'map',
                    body: {
                        method: 'delete',
                        dir: request.query.dir == 'true',
                        prevValue: coalesce(request.query.prevValue),
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
