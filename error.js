const MESSAGES = new Map([[
    102, 'Not a file'
], [
    104, 'Not a directory'
]])

// Does not need to be an error class because we are never going to need a stack
// trace nor do we want to take the time to create one.
class AddendumError {
    constructor (http, code, cause) {
        this.http = http
        this.code = code
        this.cause = cause
    }

    response (index) {
        return [ this.http, {
            statusCode: this.code,
            message: MESSAGES.get(this.code),
            cause: this.cause,
            index: index
        }, {
            'X-Etcd-Index': index
        }]
    }
}

module.exports = AddendumError
