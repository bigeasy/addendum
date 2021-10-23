const WildMap = require('wildmap')
const { Queue } = require('avenue')
const AddendumError = require('./error')

class Tree {
    static Error = class {
        constructor (code, cause) {
            this.code = code
            this.cause = cause
        }

        message (index) {
            return {
                statusCode: this.code,
                cause: this.cause,
            }
        }
    }

    constructor () {
        this.wildmap = new WildMap
        this.events = new Queue
    }

    snapshot () {
        return this.wildmap.glob([ '', this.wildmap.recursive ])
            .map(key => ({ key, body: this.wildmap.get(key) }))
            .filter(({ key, body }) => { console.log(key, body); return ! body.dir })
            .map(({ key, body }) => ({ key: key.join('/'), value: body.value }))
    }

    join (snapshot) {
        for (const { key, value } of snapshot) {
            this.set(key, value)
        }
    }

    check (key, dir) {
        for (let i = 1, I = key.length - 1; i < I; i++) {
            const dir = key.slice(0, i)
            const got = this.wildmap.get(dir)
            if (got == null) {
                return
            }
            if (! got.dir) {
                throw new AddendumError(403, 104, dir.join('/'))
            }
        }
        const got = this.wildmap.get(key)
        if (got != null && got.dir != dir) {
            if (dir) {
                throw new AddendumError(403, 104, key.join('/'))
            } else {
                throw new AddendumError(403, 102, key.join('/'))
            }
        }
    }

    set (key, value) {
        this._mkdir(key.slice(0, key.length - 1))
        this.wildmap.set(key, { dir: false, value: value })
    }

    _cause (key) {
        for (let i = 1, I = key.length; i < I; i++) {
            if (! this.wildmap.exists(key.slice(0, i))) {
                return key.slice(0, i).join('/')
            }
        }
    }

    get (key) {
        const got = this.wildmap.get(key)
        if (got == null) {
            return null
        }
        return got.value
    }

    _mkdir (key) {
        for (let i = 1, I = key.length + 1; i != I; i++) {
            this.wildmap.set(key.slice(0, i), { dir: true })
        }
    }

    mkdir (key) {
        this._mkdir(key)
    }

    remove (key) {
        this.wildmap.remove(key)
    }
}

module.exports = Tree
