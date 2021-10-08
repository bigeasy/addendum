class Log {
    constructor (max) {
        this.size = 0
        this.length = 0
        this.max = max
        this.head = { event: null, next: null, previous: null, index: -1 }
        this.head.next = this.head.previous = this.head
    }

    add (event) {
        const node = {
            index: this.length++,
            event: event,
            previous: this.head.previous,
            next: this.head
        }
        node.next.previous = node
        node.previous.next = node
        if (++this.size > this.max) {
            const remove = this.head.next
            remove.next.previous = remove.previous
            remove.previous.next = remove.next
            this.size--
        }
        return event
    }

    find (index, f) {
        const found = []
        if (index < this.head.next.index) {
            return null
        }
        let iterator = this.head.next
        while (iterator !== this.head && iterator.index != index) {
            iterator = iterator.next
        }
        while (iterator != this.head) {
            if (f(iterator.event)) {
                found.push(iterator.event)
            }
            iterator = iterator.next
        }
        return found
    }
}

module.exports = Log
