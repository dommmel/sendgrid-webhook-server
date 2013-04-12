This is a node server designed to accept webhook requests from SendGrid for relaying to a variety of other destinations. Currently, forwards messages to a HipChat room.

In your SendGrid configuration, look the Event Notification App. It will be disabled by default. Here you can enable the web hook.

Choose to be notified for whichever events you're interested in. We typically monitor: dropped, bounced, unsubscribe, spam.  Monitoring deferred email seemed to create a lot of noise.

Server and routing code was adapted from Manuel Kiessling's book, The Node Beginner Book at http://www.nodebeginner.org.

TODO: This code cannot currently handle enabling the "Batch event notifications" setting in SendGrid. The code expects only one message at a time.