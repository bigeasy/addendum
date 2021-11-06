
// **TODO** Does the root key exist on a fresh boot of `etcd` and if so what is
// its index and value?

const count = 32

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
        const response = await GET('/v2/keys/addendum')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { dir: true, key: '/addendum' }
            }
        }, 'get empty root directory')
    }

    {
        const response = await PUT('/v2/keys/addendum/x', { value: 'x' })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { value: 'x', key: '/addendum/x' }
            }
        }, 'set key')
    }

    {
        const response = await GET('/v2/keys/addendum/x')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { value: 'x', key: '/addendum/x' }
            }
        }, 'get key')
    }

    {
        const response = await PUT('/v2/keys/addendum/x', { value: 'y' })
        okay(prune(response), {
            status: 200,
            data: {
                action: 'set',
                node: { value: 'y', key: '/addendum/x' },
                prevNode: { value: 'x', key: '/addendum/x' }
            }
        }, 'update key')
    }

    {
        const response = await GET('/v2/keys/addendum/x')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { value: 'y', key: '/addendum/x' }
            }
        }, 'get updated key')
    }

    {
        const response = await GET('/v2/keys/addendum')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: {
                    dir: true,
                    key: '/addendum',
                    nodes: [{
                        key: '/addendum/x',
                        value: 'y'
                    }]
                }
            }
        }, 'list single item directory')
    }

    {
        const response = await PUT('/v2/keys/addendum/y/z', { value: 'z' })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { value: 'z', key: '/addendum/y/z' }
            }
        }, 'create key with vivified path')
    }

    {
        const response = await GET('/v2/keys/addendum')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: {
                    dir: true,
                    key: '/addendum',
                    nodes: [{
                        key: '/addendum/x',
                        value: 'y'
                    }, {
                        key: '/addendum/y',
                        dir: true
                    }]
                }
            }
        }, 'list directory with vivified directory')
    }

    {
        const response = await GET('/v2/keys/addendum?recursive=true')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: {
                    dir: true,
                    key: '/addendum',
                    nodes: [{
                        key: '/addendum/x',
                        value: 'y'
                    }, {
                        key: '/addendum/y',
                        dir: true,
                        nodes: [{
                            key: '/addendum/y/z',
                            value: 'z'
                        }]
                    }]
                }
            }
        }, 'list directory recursive')
    }

    {
        const response = await PUT('/v2/keys/addendum/z', { value: 'z' })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: {
                    value: 'z',
                    key: '/addendum/z',
                }
            }
        }, 'create file for directory overwrite')
    }

    {
        const response = await PUT('/v2/keys/addendum/z', { dir: true })
        okay(prune(response), {
            status: 200,
            data: {
                action: 'set',
                node: { dir: true, key: '/addendum/z', },
                prevNode: { value: 'z', key: '/addendum/z', }
            }
        }, 'create directory over file')
    }

    {
        const response = await PUT('/v2/keys/addendum/z', { dir: true })
        okay(prune(response), {
            status: 403,
            data: {
                errorCode: 102, message: 'Not a file', cause: '/addendum/z'
            }
        }, 'create directory over directory')
    }

    {
        const response = await PUT('/v2/keys/addendum/z', { value: 'z' })
        okay(prune(response), {
            status: 403,
            data: {
                errorCode: 102, message: 'Not a file', cause: '/addendum/z'
            }
        }, 'create file over directory')
    }

    {
        const response = await PUT('/v2/keys/addendum/x/y/z', { value: 'z' })
        okay(prune(response), {
            status: 400,
            data: {
                errorCode: 104, message: 'Not a directory', cause: '/addendum/x'
            }
        }, 'create directory with file in path')
    }

    {
        const response = await DELETE('/v2/keys/addendum/z')
        okay(prune(response), {
            status: 403,
            data: { errorCode: 102, message: 'Not a file', cause: '/addendum/z' }
        }, 'delete directory no recursive')
    }

    {
        const response = await DELETE('/v2/keys/addendum/z?dir=true')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/z', dir: true },
                prevNode: { key: '/addendum/z', dir: true }
            }
        }, 'delete directory')
    }

    {
        const response = await DELETE('/v2/keys/addendum/z?dir=true')
        okay(prune(response), {
            status: 404,
            data: { errorCode: 100, message: 'Key not found', cause: '/addendum/z' }
        }, 'delete deleted directory')
    }

    {
        const response = await DELETE('/v2/keys/addendum/z/y/x?dir=true')
        okay(prune(response), {
            status: 404,
            data: { errorCode: 100, message: 'Key not found', cause: '/addendum/z' }
        }, 'delete sub-directory from deleted directory')
    }

    {
        const response = await GET('/v2/keys/addendum/z')
        okay(prune(response), {
            status: 404,
            data: { errorCode: 100, message: 'Key not found', cause: '/addendum/z' }
        }, 'get deleted directory')
    }

    {
        const response = await GET('/v2/keys/addendum/z/y/x')
        okay(prune(response), {
            status: 404,
            data: { errorCode: 100, message: 'Key not found', cause: '/addendum/z' }
        }, 'get sub-directory from deleted directory')
    }

    {
        const response = await DELETE('/v2/keys/addendum/x')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/x' },
                prevNode: { key: '/addendum/x', value: 'y' }
            }
        }, 'delete key')
    }

    {
        const response = await DELETE('/v2/keys/addendum/x')
        okay(prune(response), {
            status: 404,
            data: { errorCode: 100, message: 'Key not found', cause: '/addendum/x' }
        }, 'delete deleted key')
    }

    {
        const response = await DELETE('/v2/keys/addendum/y?dir=true')
        okay(prune(response), {
            status: 403,
            data: { errorCode: 108, message: 'Directory not empty', cause: '/addendum/y' }
        }, 'delete directory with children not-recursive')
    }

    {
        const response = await DELETE('/v2/keys/addendum/y?recursive=true')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/y', dir: true },
                prevNode: { key: '/addendum/y', dir: true }
            }
        }, 'delete directory with children recursive')
    }

    {
        const response = await PUT('/v2/keys/addendum/y/z', { value: 'z' })
        okay(prune(response), {
            status: 201,
            data: {
                action: 'set',
                node: { key: '/addendum/y/z', value: 'z' },
            }
        }, 'put value for both dir and recursive test')
    }

    {
        const response = await GET('/v2/keys/addendum/y/..')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: {
                    key: '/addendum',
                    dir: true,
                    nodes: [{ key: '/addendum/y', dir : true }]
                },
            }
        }, 'get with dots in the path')
    }

    {
        const response = await DELETE('/v2/keys/addendum/y?dir=true&recursive=true')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'delete',
                node: { key: '/addendum/y', dir: true },
                prevNode: { key: '/addendum/y', dir: true }
            }
        }, 'delete recursive with both dir and recursive flag')
    }

    {
        const response = await GET('/v2/keys/addendum/')
        okay(prune(response), {
            status: 200,
            data: {
                action: 'get',
                node: { key: '/addendum', dir: true }
            }
        }, 'get with trailing slash')
    }

    {
        const response = await DELETE('/v2/keys/')
        okay(prune(response), {
            status: 400,
            data: { errorCode: 107, message: 'Root is read only', cause: '/' }
        }, 'delete root')
    }

    {
        const response = await PUT('/v2/keys/', { dir: true })
        okay(prune(response), {
            status: 400,
            data: { errorCode: 107, message: 'Root is read only', cause: '/' }
        }, 'put root')
    }
}

harness(count, test)
