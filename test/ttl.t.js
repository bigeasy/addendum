'use strict'
// **TODO** Does the root key exist on a fresh boot of `etcd` and if so what is
// its index and value?

const count = 8

const harness = require('./harness')

async function test (okay, { DELETE, GET, PUT, prune, controller }) {
    await DELETE('/v2/keys/addendum?recursive=true')

    let startIndex = 0

    {
        const response = await GET('/v2/keys/')
        delete response.data.node.nodes
        okay(response.data.node, { dir: true }, 'root has no key or indexes')
    }

    {
        const response = await PUT('/v2/keys/addendum', { dir: true })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { dir: true, key: '/addendum' }
            }
        }, 'create root directory')
        startIndex = parseInt(response.headers['x-etcd-index'], 10)
    }
    {
        const response = await PUT('/v2/keys/addendum/ttl/x', { value: 'x', ttl: 1 })
        const remaining = new Date(response.data.node.expiration) - new Date()
        const giveOrTake = controller == 'etcd' ? 25 : 0
        okay(remaining - giveOrTake < 1000, `set is less than a second give or take ${giveOrTake} - actual: ${remaining}`)
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { value: 'x', key: '/addendum/ttl/x', ttl: 1 }
            }
        }, 'set key')
        await new Promise(resolve => setTimeout(resolve, 250))
    }
    let expiration = null
    {
        const response = await PUT('/v2/keys/addendum/ttl/x', { ttl: 1, refresh: true })
        const remaining = new Date(response.data.node.expiration) - new Date()
        const giveOrTake = controller == 'etcd' ? 25 : 0
        okay(new Date(response.data.node.expiration) - new Date(expiration) >= 250, 'set over expiration advanced')
        okay(remaining - giveOrTake < 1000, `set over is less than a second give or take ${giveOrTake} - actual: ${remaining}`)
        expiration = response.data.node.expiration
        okay(prune(response), {
            status: 200,
            data: {
                action: 'set',
                node: { key: '/addendum/ttl/x', ttl: 1, value: 'x' },
                prevNode: { key: '/addendum/ttl/x', ttl: 1, value: 'x' }
            }
        }, 'set over ttl')
        await new Promise(resolve => setTimeout(resolve, 1500))
    }
    // **TODO** Above was a `set`, this should be a `reset` with `prevExit`.
    // **TODO** Reset without `refresh` and you'll see an empty value.
    {
        const response = await GET('/v2/keys/addendum/ttl/x')
        okay(prune(response), {
            status: 404,
            data: { errorCode: 100, message: 'Key not found', cause: '/addendum/ttl/x' }
        }, 'key ttl')
    }
    // **TODO** TTL for dir.
    // **TODO** Could use x-ectd-index and a previous node to check that a new
    // node has the correct `createdIndex` and `modifiedIndex`.
}

harness(count, test)
