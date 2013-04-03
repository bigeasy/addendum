# Addendum Design

Database migrations are a nifty thing, I was happy when they came my way. I'd
like to have them for Node.js, so here goes.

## Snapshots

I want to go forward and back, but rather than trying to reverse a migration,
I'd rather just create a snapshot of the database. You can't go back in
production, you only do that sort of thing in development, so go ahead and
create a backup of your development database, then rollback by rebuilding the
database.

## Cross-Platform

It ought to be cross-platformy, for people who do want to offer a product that
can target different databases, but it won't be a baby about it. If you are
building an application and targeting a specific database, you're going to have
what you need to target your specific database.

You can use schemas in PostgreSQL however you would like, for example, but if
your database design demands multiple schemas, then it is not going to port to
MySQL.

Selecting a schema in which to run a migration can be PostgreSQL specific, so
that you can have multi-tenant databases.

## Git Integration.

I'd like to be able to tie into `git` so that when I switch branches, my
migrations run (or my rollback) to put me where I need to be on that branch.

## Configuration

Step one is configuration. We want to be be able to specify a database from a
configuration, possibly using the `production`, `test`, `development` categories
used by Ruby on Rails.

We probably want configuration to be JSON, but perhaps a JavaScript module is
better, it would permit comments.

## Storage

Name value pairs until further notice. Create an object that reads values, but
writes them with a callback, so that they are set to the database immediately,
or else, perhaps, the writes are part of transaction. In PostgreSQL, at least,
a failed migration would stop in a consistent state.

