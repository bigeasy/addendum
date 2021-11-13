// Count of tests for a single pass of tests for either `etcd` or Addendum.
const count = 5

// Our test harness will optionally test against `etcd`.
const harness = require('./harness')

// Our test.

//
async function test (okay, { DELETE, GET, PUT, prune }) {
    // Reset our addendum test path.
    await DELETE('/v2/keys/addendum?recursive=true')

    // Ensure that the addendum test path is empty.
    {
        const response = await GET('/v2/keys/')
        delete response.data.node.nodes
        okay(response.data.node, { dir: true }, 'root has no key or indexes')
    }

    // Create a key to atomically set.
    {
        const response = await PUT('/v2/keys/addendum', { dir: true })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { dir: true, key: '/addendum' }
            }
        }, 'create root directory')
    }

    // Failure of atomic compare and set.
    {
        const response = await GET('/v2/keys/addendum')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { dir: true, key: '/addendum' }
            }
        }, 'get empty root directory')
    }

    // Success of atomic compare and set.
    {
        const response = await PUT('/v2/keys/addendum/quorum/x', { value: 'x' })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { value: 'x' , key: '/addendum/quorum/x' }
            }
        }, 'set key')
    }

    {
        const response = await GET('/v2/keys/addendum/quorum/x?quorum=true')
        okay(prune(response), {
            status: 200,
            data: { action: 'get', node: { key: '/addendum/quorum/x', value: 'x' } }
        }, 'quorum get')
    }
}

harness(count, test)
