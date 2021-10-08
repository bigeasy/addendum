## Fri Oct  8 12:01:58 CDT 2021

Implement TTL expiration using reduce. Having a TTL will create an entry in a
map and we'll queue the expiration into Happenstance. Each unanimous has a
Happenstance. When they fire we will send a response and have them start
counting down. Race if one of them gets reset so how about a unanimous
countdown, any reset clears the previous by sending the countdown with a reset
message, any reset in the reduce means we do not cancel.

Partial matching means we have to loop through the last 1000 events doing
partial matches on arrays. Actually, could do string matching too.

The long polling, each end point can listen, check for the pool of listeners for
a specific key. This is going to be a linear scan.

The queue implementation with POST, each directory will have to have a counter,
easy enough to maintain, curious as to whether it gets reset.

Anyway, it need to be close enough. If people find discrepancies they can submit
issues if they actually want to use this in production.
