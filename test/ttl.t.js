// **TODO** Does the root key exist on a fresh boot of `etcd` and if so what is
// its index and value?

const count = 5

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
        const response = await PUT('/v2/keys/addendum/x', { value: 'x', ttl: 1 })
        const remaining = new Date(response.data.node.expiration) - new Date()
        const giveOrTake = controller == 'etcd' ? 25 : 0
        okay(remaining - giveOrTake < 1000, `in less than a second give or take ${giveOrTake} - actual: ${remaining}`)
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { value: 'x', key: '/addendum/x', ttl: 1 }
            }
        }, 'set key')
        await new Promise(resolve => setTimeout(resolve, 1500))
    }
    {
        const response = await GET('/v2/keys/addendum/x')
        okay(prune(response), {
            status: 404,
            data: { errorCode: 100, message: 'Key not found', cause: '/addendum/x' }
        }, 'key ttl')
    }
}

harness(count, test)
