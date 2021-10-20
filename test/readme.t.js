// [![Actions Status](https://github.com/bigeasy/addendum/workflows/Node%20CI/badge.svg)](https://github.com/bigeasy/addendum/actions)
// [![codecov](https://codecov.io/gh/bigeasy/addendum/branch/master/graph/badge.svg)](https://codecov.io/gh/bigeasy/addendum)
// [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
//
// A Paxos-based `etcd`-alike in JavaScript.
//
// | What          | Where                                         |
// | --- | --- |
// | Discussion    | https://github.com/bigeasy/addendum/issues/1  |
// | Documentation | https://bigeasy.github.io/addendum            |
// | Source        | https://github.com/bigeasy/addendum           |
// | Issues        | https://github.com/bigeasy/addendum/issues    |
// | CI            | https://travis-ci.org/bigeasy/addendum        |
// | Coverage:     | https://codecov.io/gh/bigeasy/addendum        |
// | License:      | MIT                                           |
//
//
// Addendum installs from NPM.

// ## Living `README.md`
//
// This `README.md` is also a unit test using the
// [Proof](https://github.com/bigeasy/proof) unit test framework. We'll use the
// Proof `okay` function to assert out statements in the readme. A Proof unit test
// generally looks like this.

require('proof')(1, okay => {
    // ## Overview

    okay('TODO')
})

// You can run this unit test yourself to see the output from the various
// code sections of the readme.

// ## Project Purpose and Status
//
// This living `README.md` is a template, but the usage of Addendum is not as
// interesting as Addendum itself. It's an example of how to build an application
// with the Paxos-backed atomic log Compassion. Read through the [annotated
// Docco](https://bigeasy.github.io/addendum/docco/addendum.js.html)
// for an understanding of message ordering and map/reduce.
