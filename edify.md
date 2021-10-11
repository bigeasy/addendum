[![Actions Status](https://github.com/bigeasy/addendum/workflows/Node%20CI/badge.svg)](https://github.com/bigeasy/addendum/actions)
[![codecov](https://codecov.io/gh/bigeasy/addendum/branch/master/graph/badge.svg)](https://codecov.io/gh/bigeasy/addendum)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Paxos-based `etcd`-alike in JavaScript.

| What          | Where                                         |
| --- | --- |
| Discussion    | https://github.com/bigeasy/addendum/issues/1  |
| Documentation | https://bigeasy.github.io/addendum            |
| Source        | https://github.com/bigeasy/addendum           |
| Issues        | https://github.com/bigeasy/addendum/issues    |
| CI            | https://travis-ci.org/bigeasy/addendum        |
| Coverage:     | https://codecov.io/gh/bigeasy/addendum        |
| License:      | MIT                                           |


Addendum installs from NPM.

```
//{ "mode": "text" }
npm install addendum
```

## Living `README.md`

This `README.md` is also a unit test using the
[Proof](https://github.com/bigeasy/proof) unit test framework. We'll use the
Proof `okay` function to assert out statements in the readme. A Proof unit test
generally looks like this.

```javascript
//{ "code": { "tests": 1 }, "text": { "tests": 4  } }
require('proof')(%(tests)d, okay => {
    //{ "include": "test", "mode": "code" }
    //{ "include": "proof" }
})
```

```javascript
//{ "name": "proof", "mode": "text" }
okay('always okay')
okay(true, 'okay if true')
okay(1, 1, 'okay if equal')
okay({ value: 1 }, { value: 1 }, 'okay if deep strict equal')
```

You can run this unit test yourself to see the output from the various
code sections of the readme.

```text
//{ "mode": "text" }
git clone git@github.com:bigeasy/addendum.git
cd addendum
npm install --no-package-lock --no-save
node test/readme.t.js
```

## Overview

```javascript
//{ "name": "test" }
okay('TODO')
```
