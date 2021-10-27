const rescue = require('rescue')

function etcd (count, f) {
    const config = function () {
        try {
            return require('./etcd.config.json')
        } catch (error) {
            rescue(error, [{ code: 'MODULE_NOT_FOUND' }])
            return null
        }
    } ()
    require('proof')(config == null ? count : count * 2, async okay => {
        const url = require('url')
        const qs = require('qs')

        const axios = require('axios')

        const children = require('child_process')

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

        await f(okay, controllers)
    })
}

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

function HTTP (location) {
    const axios = require('axios')
    const qs = require('qs')

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

        function GET (path) {
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

        function PUT (path, body) {
            return HTTP({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify(body),
                url: location + path
            })
        }
    return  { GET, PUT, DELETE }
}

module.exports = { etcd, HTTP, prune }
