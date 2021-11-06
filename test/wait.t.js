// **TODO** Does the root key exist on a fresh boot of `etcd` and if so what is
// its index and value?

const count = 20

const harness = require('./harness')

async function test (okay, { DELETE, GET, PUT, prune }) {
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
        const get = GET('/v2/keys/addendum/wait?wait=true&recursive=true', { dir: true })
        await new Promise(resolve => setTimeout(resolve, 50))
        const put = await PUT('/v2/keys/addendum/wait', { dir: true })
        okay(prune(await get), {
            status: 200,
            data: {
                action: 'set',
                node: { key: '/addendum/wait', dir: true }
            }
        }, 'get recusive wait on missing directory')
        okay(prune(put), {
            status: 201,
            data: {
                action: 'set',
                node: { key: '/addendum/wait', dir: true }
            }
        }, 'put recursive wait on missing directory')
    }

    {
        // **TODO** Should be recursive.
        const get = await GET(`/v2/keys/addendum/wait?waitIndex=${startIndex}`)
        okay(prune(get), {
            status: 200,
            data: {
                action: 'get',
                node: { key: '/addendum/wait', dir: true }
            }
        }, 'get wait index without wait is get')
    }

    {
        const get = await GET(`/v2/keys/addendum/wait?waitIndex=${startIndex}&wait=true`)
        let index = get.data.node.modifiedIndex + 1
        okay(prune(get), {
            status: 200,
            data: {
                action: 'set',
                node: { key: '/addendum/wait', dir: true }
            }
        }, 'get wait index')
    }

    {
        const get = GET(`/v2/keys/addendum/wait/z?wait=true`)
        await new Promise(resolve => setTimeout(resolve, 150))
        const put = await PUT('/v2/keys/addendum/wait/z', { value: 'z' })
        okay(prune(await get), {
            status: 200,
            data: {
                action: 'set',
                node: { key: '/addendum/wait/z', value: 'z' }
            }
        }, 'get wait key')
        okay(prune(put), {
            status: 201,
            data: {
                action: 'set',
                node: { key: '/addendum/wait/z', value: 'z' }
            }
        }, 'put wait key')
    }

    {
        const get = GET(`/v2/keys/addendum/wait?wait=true&recursive=true`)
        await new Promise(resolve => setTimeout(resolve, 150))
        const put = await PUT('/v2/keys/addendum/wait/x', { value: 'x' })
        okay(prune(await get), {
            status: 200,
            data: {
                action: 'set',
                node: { key: '/addendum/wait/x', value: 'x' }
            }
        }, 'get wait recursive')
        okay(prune(put), {
            status: 201,
            data: {
                action: 'set',
                node: { key: '/addendum/wait/x', value: 'x' }
            }
        }, 'put wait recursive')
    }

    {
        const gathered = []
        let index = startIndex
        for (let i = 0; i < 2; i++) {
            const get = await GET(`/v2/keys/addendum/wait?wait=true&recursive=true&waitIndex=${index}`)
            gathered.push(prune(get))
            index = get.data.node.modifiedIndex + 1
        }
        const get = GET(`/v2/keys/addendum/wait?wait=true&recursive=true&waitIndex=${index}`)
        await new Promise(resolve => setTimeout(resolve, 150))
        const put = await PUT('/v2/keys/addendum/wait/x', { value: 'z' })
        const got = await get
        okay(prune(got), {
            status: 200,
            data: {
                action: 'set',
                node: { key: '/addendum/wait/x', value: 'z' },
                prevNode: { key: '/addendum/wait/x', value: 'x' }
            }
        }, 'get wait iterate')
        okay(prune(put), {
            status: 200,
            data: {
                action: 'set',
                node: { key: '/addendum/wait/x', value: 'z' },
                prevNode: { key: '/addendum/wait/x', value: 'x' }
            }
        }, 'put wait iterate')
    }

    {
        // **TODO** Backticks only as needed.
        const get = GET(`/v2/keys/addendum/wait?wait=true&recursive=true`)
        await new Promise(resolve => setTimeout(resolve, 150))
        const del = await DELETE('/v2/keys/addendum/wait/z')
        okay(prune(await get), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait/z' },
                prevNode: { key: '/addendum/wait/z', value: 'z' }
            }
        }, 'get wait recursive delete key')
        okay(prune(del), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait/z' },
                prevNode: { key: '/addendum/wait/z', value: 'z' }
            }
        }, 'delete wait recursive delete key')
    }

    {
        const get = GET('/v2/keys/addendum/wait/x?wait=true')
        await new Promise(resolve => setTimeout(resolve, 150))
        const del = await DELETE('/v2/keys/addendum/wait/x')
        okay(prune(await get), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait/x' },
                prevNode: { key: '/addendum/wait/x', value: 'z' }
            }
        }, 'get wait delete key')
        okay(prune(del), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait/x' },
                prevNode: { key: '/addendum/wait/x', value: 'z' }
            }
        }, 'delete wait delete key')
    }

    {
        const get = GET('/v2/keys/addendum/wait?wait=true&recursive=true')
        await new Promise(resolve => setTimeout(resolve, 50))
        const del = await DELETE('/v2/keys/addendum/wait?dir=true')
        okay(prune(await get), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait', dir: true },
                prevNode: { key: '/addendum/wait', dir: true }
            }
        }, 'get recursive wait delete waiting directory')
        okay(prune(del), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait', dir: true },
                prevNode: { key: '/addendum/wait', dir: true }
            }
        }, 'delete recursive wait delete waiting directory')
    }

    {
        const requests = []
        requests.push(await PUT('/v2/keys/addendum/wait/x', { value: 'x' }))
        const get = GET('/v2/keys/addendum/wait?wait=true&recursive=true')
        await new Promise(resolve => setTimeout(resolve, 52))
        requests.push(await DELETE('/v2/keys/addendum/wait?recursive=true'))
        okay(prune(await get), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait', dir: true },
                prevNode: { key: '/addendum/wait', dir: true }
            }
        }, 'get wait delete directory recursive')
        okay(requests.map(request => prune(request)), [{
            status: 201,
            data: {
                action: 'set',
                node: { key: '/addendum/wait/x', value: 'x' },
            }
        }, {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/wait', dir: true },
                prevNode: { key: '/addendum/wait', dir: true }
            }
        }], 'delete wait delete key')
    }
}

harness(count, test)
