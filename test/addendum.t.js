require('proof')(13, async okay => {
    const url = require('url')
    const qs = require('qs')

    const Addendum = require('..')

    const axios = require('axios')

    const Compassion = require('compassion')

    const { Queue } = require('avenue')
    const Destructible = require('destructible')
    const destructible = new Destructible('t/addendum.t.js')

    class Participant {
        constructor (addendum, addresses) {
            this.addendum = addendum
            this.addresses = addresses
        }

        get url () {
            return {
                compassion: `http://${this.addresses.compassion.address}:${this.addresses.compassion.port}`,
                addendum: `http://${this.addresses.addendum.address}:${this.addresses.addendum.port}`
            }
        }

        static async create (destructible, census) {
            const addendum = new Addendum(destructible.durable('addendum'))
            const addresses = {
                compassion: null,
                addendum: null
            }
            addresses.compassion = await Compassion.listen(destructible.durable('compassion'), {
                census: census,
                applications: { addendum },
                bind: { host: '127.0.0.1', port: 0 }
            })
            const fastify = addendum.reactor.fastify
            fastify.register(require('fastify-formbody'))
            addresses.addendum = await fastify.listen({ host: '127.0.0.1', port: 0 })
            destructible.destruct(() => destructible.ephemeral('close', () => addendum.reactor.fastify.close()))
            addresses.addendum = addendum.reactor.fastify.server.address()
            return new Participant(addendum, addresses)
        }
    }

    destructible.durable('test', async () => {
        const census = new Queue()
        destructible.destruct(() => census.push(null))
        const participants = []
        participants.push(await Participant.create(destructible.durable('addendum.1'), census.shifter()))
        census.push([ participants[0].url.compassion ])
        await participants[0].addendum.ready.promise
        {
            const response = await axios.get(participants[0].url.addendum)
            okay(response.data, 'Addendum API\n', 'index')
        }
        {
            const response = await axios({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify({ value: 'x' }),
                url: url.resolve(participants[0].url.addendum, '/v2/keys/x')
            })
            okay(response.data, {
                action: 'set',
                node: {
                    key: '/x',
                    value: 'x',
                    createdIndex: 0,
                    modifiedIndex: 0
                }
            }, 'set')
        }
        {
            const response = await axios({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify({ value: 'y' }),
                url: url.resolve(participants[0].url.addendum, '/v2/keys/x')
            })
            okay(response.data, {
                action: 'set',
                node: {
                    key: '/x',
                    value: 'y',
                    createdIndex: 0,
                    modifiedIndex: 1
                },
                prevNode: {
                    key: '/x',
                    value: 'x',
                    createdIndex: 0,
                    modifiedIndex: 0
                }
            }, 'overwrite')
        }
        {
            const response = await axios({
                method: 'DELETE',
                url: url.resolve(participants[0].url.addendum, '/v2/keys/x')
            })
            okay(response.data, {
                action: 'delete',
                node: {
                    key: '/x',
                    createdIndex: 0,
                    modifiedIndex: 2
                },
                prevNode: {
                    key: '/x',
                    value: 'y',
                    createdIndex: 0,
                    modifiedIndex: 1
                }
            }, 'delete')
        }
        {
            const response = await axios({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify({ dir: true }),
                url: url.resolve(participants[0].url.addendum, '/v2/keys/hello/dolly/oh/hello')
            })
            okay(response.data, {
                action: 'set',
                node: {
                    key: '/hello/dolly/oh/hello',
                    dir: true,
                    createdIndex: 3,
                    modifiedIndex: 3
                },
            }, 'create directory')
        }
        {
            const response = await axios({
                method: 'GET',
                url: url.resolve(participants[0].url.addendum, '/v2/keys/hello/dolly/oh/hello')
            })
            okay(response.data, {
                action: 'get',
                node: {
                    key: '/hello/dolly/oh/hello',
                    dir: true,
                    createdIndex: 3,
                    modifiedIndex: 3
                },
            }, 'list empty directory')
        }
        {
            const response = []
            try {
                await axios({
                    method: 'PUT',
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    data: qs.stringify({ value: 'x' }),
                    url: url.resolve(participants[0].url.addendum, '/v2/keys/hello/dolly/oh/hello')
                })
            } catch (error) {
                response.push({
                    statusCode: error.response.status,
                    body: error.response.data
                })
            }
            okay(response.shift(), {
                statusCode: 403,
                body: {
                    statusCode: 102,
                    message: 'Not a file',
                    cause: '/hello/dolly/oh/hello',
                    index: 3
                }
            }, 'create file over directory')
        }
        {
            const response = []
            try {
                await axios({
                    method: 'PUT',
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    data: qs.stringify({ dir: true }),
                    url: url.resolve(participants[0].url.addendum, '/v2/keys/hello/dolly/oh/hello')
                })
            } catch (error) {
                response.push({
                    statusCode: error.response.status,
                    body: error.response.data
                })
            }
            okay(response.shift(), {
                statusCode: 403,
                body: {
                    statusCode: 102,
                    message: 'Not a file',
                    cause: '/hello/dolly/oh/hello',
                    index: 3
                }
            }, 'create directory over directory')
        }
        {
            await axios({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify({ value: 'x' }),
                url: url.resolve(participants[0].url.addendum, '/v2/keys/hello/world')
            })
            const response = []
            try {
                await axios({
                    method: 'PUT',
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    data: qs.stringify({ value: 'x' }),
                    url: url.resolve(participants[0].url.addendum, '/v2/keys/hello/world/hello')
                })
            } catch (error) {
                response.push({
                    statusCode: error.response.status,
                    body: error.response.data
                })
            }
            okay(response.shift(), {
                statusCode: 403,
                body: {
                    statusCode: 104,
                    message: 'Not a directory',
                    cause: '/hello/world',
                    index: 4
                }
            }, 'create file with file in path')
        }
        {
            const response = await axios({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify({ value: 'x', ttl: 1 }),
                url: url.resolve(participants[0].url.addendum, '/v2/keys/x')
            })
            okay(response.data, {
                action: 'set',
                node: {
                    key: '/x',
                    value: 'x',
                    createdIndex: 5,
                    modifiedIndex: 5
                }
            }, 'set with ttl')
        }
        {
            const response = await axios({
                method: 'PUT',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify({ value: 'x', ttl: 1 }),
                url: url.resolve(participants[0].url.addendum, '/v2/keys/x')
            })
            okay(response.data, {
                action: 'set',
                node: {
                    key: '/x',
                    value: 'x',
                    createdIndex: 5,
                    modifiedIndex: 6
                },
                prevNode: {
                    key: '/x',
                    value: 'x',
                    createdIndex: 5,
                    modifiedIndex: 5
                }
            }, 'reset with ttl')
        }
        {
            await new Promise(resolve => setTimeout(resolve, 2000))
            try {
                const got = await axios({
                    method: 'GET',
                    url: url.resolve(participants[0].url.addendum, '/v2/keys/x')
                })
                console.log(got.data)
            } catch (error) {
                okay(error.response.status, 404, 'get ttl deleted')
                okay(error.response.data, {
                    errorCode: 100,
                    message: 'Key not found',
                    cause: '/x',
                    index: 6
                }, 'get ttl deleted body')
            }
        }
        destructible.destroy()
        census.push(null)
    })

    await destructible.promise
})
