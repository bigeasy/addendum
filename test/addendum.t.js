require('proof')(1, async okay => {
    const Addendum = require('..')
    const addendum = new Addendum

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
            return `http://${this.addresses.addendum.address}:${this.addresses.addendum.port}`
        }

        static async create (destructible, census) {
            const addendum = new Addendum
            const addresses = {
                compassion: null,
                addensum: null
            }
            addresses.compassion = await Compassion.listen(destructible.durable('compassion'), {
                census: census,
                applications: { addendum },
                bind: { host: '127.0.0.1', port: 0 }
            })
            addresses.addendum = await addendum.reactor.fastify.listen({ host: '127.0.0.1', port: 0 })
            destructible.destruct(() => destructible.ephemeral('close', () => addendum.reactor.fastify.close()))
            addresses.addendum = addendum.reactor.fastify.server.address()
            return new Participant(addendum, addresses)
        }
    }

    destructible.ephemeral('test', async () => {
        const census = new Queue()
        const first = await Participant.create(destructible.durable('addendum.1'), census.shifter())
        {
            const response = await axios.get(first.url)
            okay(response.data, 'Addendum API\n', 'index')
        }
        destructible.destroy()
        census.push(null)
    })

    await destructible.promise
})
