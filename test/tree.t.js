require('proof')(3, okay => {
    const Tree = require('../tree')
    const tree = new Tree

    tree.set('/hello/world'.split('/'), 'x')

    okay(tree.get('/hello/world'.split('/')), 'x', 'got')

    tree.set('/hello/dolly/oh/hello/dolly'.split('/'), 'x')

    const snapshot = tree.snapshot()
    okay(snapshot, [{
        key: '/hello/world', value: 'x'
    }, {
        key: '/hello/dolly/oh/hello/dolly', value: 'x'
    }], 'snapshot')

    {
        const join = new Tree
        join.join(snapshot)
        okay({
            '/hello/world': tree.get('/hello/world'.split('/')),
            '/hello/dolly/oh/hello/dolly': tree.get('/hello/dolly/oh/hello/dolly'.split('/'))
        }, {
            '/hello/world': 'x',
            '/hello/dolly/oh/hello/dolly': 'x'
        }, 'join got')
    }
})
