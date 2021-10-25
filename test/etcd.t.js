const fs = require('fs')

const rescue = require('rescue')

const config = function () {
    try {
        return require('./etcd.config.json')
    } catch (error) {
        rescue(error, [{ code: 'MODULE_NOT_FOUND' }])
        return null
    }
} ()

// **TODO** Does the root key exist on a fresh boot of `etcd` and if so what is
// its index and value?

const count = 31

require('proof')(config == null ? count : count * 2, async okay => {
    const url = require('url')
    const qs = require('qs')

    const axios = require('axios')

    const children = require('child_process')

    const Destructible = require('destructible')
    const { Queue } = require('avenue')

    const Compassion = require('compassion')

    const Addendum = require('../addendum')

    class AddendumController {
        static name = 'addendum'

        static async create (destructible) {
            const census = new Queue
            destructible.destruct(() => census.push(null))
            const addendum = new Addendum(destructible.durable('addendum'))
            const addresses = {
                compassion: null,
                addendum: null
            }
            addresses.compassion = await Compassion.listen(destructible.durable('compassion'), {
                census: census.shifter(),
                applications: { addendum },
                bind: { host: '127.0.0.1', port: 0 }
            })
            const fastify = addendum.reactor.fastify
            fastify.register(require('fastify-formbody'))
            fastify.addHook('onRequest', async (request, reply) => {
                const parsed = url.parse(request.url)
                const slashed = url.resolve('/', parsed.pathname)
                const pathname = slashed.endsWith('/') && slashed.length > 1
                    ? slashed.substring(0, slashed.length - 1)
                    : slashed
                if (pathname != parsed.pathname) {
                    parsed.pathname = pathname
                    reply.redirect(301, url.format(parsed))
                }
            })
            await fastify.listen({ host: '127.0.0.1', port: 0 })
            addresses.addendum = addendum.reactor.fastify.server.address()
            destructible.destruct(() => destructible.ephemeral('close', () => addendum.reactor.fastify.close()))
            const urls =  {
                compassion: `http://${addresses.compassion.address}:${addresses.compassion.port}`,
                addendum: `http://${addresses.addendum.address}:${addresses.addendum.port}`
            }
            census.push([ urls.compassion ])
            await addendum.ready.promise
            return urls.addendum
        }
    }

    class EtcdController {
        static name = 'etcd'

        static async create (destructible) {
            return `http://${config.HostIP}:2379`
        }
    }

    const controllers = [ EtcdController, AddendumController ]

    if (config == null) {
        controllers.shift()
    }
    // controllers.pop()

    function pruneNode (node) {
        const pruned = {}
        for (const name in node) {
            if (/^(?:createdIndex|modifiedIndex)$/.test(name)) {
                continue
            }
            pruned[name] = node[name]
        }
        if (node.nodes != null) {
            pruned.nodes = node.nodes.map(node => pruneNode(node)).sort((left, right) => {
                return (left.key > right.key) - (left.key < right.key)
            })
        }
        return pruned
    }

    function prune (response) {
        const copy = JSON.parse(JSON.stringify(response))
        if (Math.floor(copy.status / 100) == 2) {
            if (copy.data && copy.data.node) {
                copy.data.node = pruneNode(copy.data.node)
            }
            if (copy.data && copy.data.prevNode) {
                copy.data.prevNode = pruneNode(copy.data.prevNode)
            }
            return {
                status: copy.status,
                data: copy.data
            }
        }
        const { errorCode, message, cause } = response.data
        return {
            status: response.status,
            data: { errorCode, message, cause }
        }
    }

    for (const Controller of controllers) {
        const destructible = new Destructible(Controller.name)
        const location = await Controller.create(destructible.durable('controller'))

        async function HTTP (query) {
            try {
                const response = await axios(query)
                return {
                    headers: response.headers,
                    status: response.status,
                    data: response.data
                }
            } catch (error) {
                rescue(error, [{ isAxiosError: true }])
                return {
                    headers: error.response.headers,
                    status: error.response.status,
                    data: error.response.data
                }
            }
        }

        async function GET (path) {
            return HTTP({
                method: 'GET',
                url: location + path
            })
        }

        function DELETE (path) {
            return HTTP({
                method: 'DELETE',
                url: location + path
            })
        }

        async function PUT (path, body) {
            return HTTP({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify(body),
                url: location + path
            })
        }

        destructible.durable('test', async () => {
            await DELETE('/v2/keys/addendum?recursive=true')

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

            destructible.destroy()
        })

        await destructible.promise
    }
})
