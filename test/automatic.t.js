// Count of tests for a single pass of tests for either `etcd` or Addendum.
const count = 6

// Count of tests for a single pass of tests for either `etcd` or Addendum.
const harness = require('./harness')

// Our test.

//
async function test (okay, { POST, DELETE, GET, PUT, prune }) {
    // Reset our addendum test path.
    await DELETE('/v2/keys/addendum?recursive=true')

    // Ensure that the addendum test path is empty.
    {
        const response = await GET('/v2/keys/')
        delete response.data.node.nodes
        okay(response.data.node, { dir: true }, 'root has no key or indexes')
    }

    // Create our automatic key directory.
    {
        const response = await PUT('/v2/keys/addendum/queue', { dir: true })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { dir: true, key: '/addendum/queue' }
            }
        }, 'create root directory')
    }

    // Our automatic key directory should be empty.
    {
        const response = await GET('/v2/keys/addendum/queue')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { dir: true, key: '/addendum/queue' }
            }
        }, 'get empty root directory')
    }

    let key = null
    {
        // **TODO** Would be a nice place to have proof do semblance.
        const response = await POST('/v2/keys/addendum/queue', { value: 'x' })
        // **TODO** Actually, the `x-etcd-index` can be used to format an
        // expected key.
        const pruned = prune(response)
        key = pruned.data.node.key
        delete pruned.data.node.key
        okay(/^\/addendum\/queue\/0\d{19}$/.test(key), 'generated key')
        okay(pruned, {
            status: 201,
            data: {
                action: 'create',
                node: { value: 'x' }
            }
        }, 'get empty root directory')
    }

    {
        // **TODO** If you do `/v2/keys//addendum/queue/000...` you get a 404.
        // What happened to normalization? Need a separate test for
        // nomalization. Works with `etcd`.
        const response = await GET(`/v2/keys${key}`)
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { value: 'x', key: key }
            }
        }, 'get empty root directory')
    }
    // **TODO** Test not a directory.
}

harness(count, test)
