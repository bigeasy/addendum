// Count of tests for a single pass of tests for either `etcd` or Addendum.
const count = 7

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
        const response = await PUT('/v2/keys/addendum/atomic/x', { value: 'x' })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { value: 'x', key: '/addendum/atomic/x' }
            }
        }, 'create key')
    }

    // Failure of atomic compare and set.
    {
        const response = await GET('/v2/keys/addendum/atomic/x')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { value: 'x', key: '/addendum/atomic/x' }
            }
        }, 'get key')
    }

    // Failure of atomic compare and set.
    {
        const response = await PUT('/v2/keys/addendum/atomic/x?prevValue=y', { value: 'x' })
        okay(prune(response), {
            status: 412,
            data: { errorCode: 101, message: 'Compare failed', cause: '[y != x]' }
        }, 'atomic set compare failure')
    }

    // Success of atomic compare and set.
    {
        const response = await PUT('/v2/keys/addendum/atomic/x?prevValue=x', { value: 'y' })
        okay(prune(response), {
            status: 200,
            data: {
                action: 'compareAndSwap',
                node: { key: '/addendum/atomic/x', value: 'y' },
                prevNode: { key: '/addendum/atomic/x', value: 'x' }
            }
        }, 'atomic set compare')
    }

    // Failure of atomic compare and delete.
    {
        const response = await DELETE('/v2/keys/addendum/atomic/x?prevValue=x')
        okay(prune(response), {
            status: 412,
            data: { errorCode: 101, message: 'Compare failed', cause: '[x != y]' }
        }, 'atomic set compare')
    }

    // Success of atomic compare and delete.
    {
        const response = await DELETE('/v2/keys/addendum/atomic/x?prevValue=y')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'compareAndDelete',
                node: { key: '/addendum/atomic/x' },
                prevNode: { key: '/addendum/atomic/x', value: 'y' }
            }
        }, 'atomic set compare')
    }
}

harness(count, test)
