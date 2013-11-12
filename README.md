**About**

This project implements a node HTTP server which can accept [webhook event requests from SendGrid](http://sendgrid.com/docs/API_Reference/Webhooks/event.html).

You can configure SendGrid to make webhook calls when email is processed, dropped, deferred, delivered, bounced, clicked, opened, unsubscribed from or marked as spam.

This server transforms the event information from SendGrid into HipChat-valid HTML and posts it into a HipChat room for monitoring.

**Configuration**

You'll need a HipChat API Auth Token of type Admin to be able to post messages to HipChat. You'll also need the room number of the HipChat room you want to post to. The room number can be had from the URL of the chat history web page for the room in question.

In your SendGrid configuration, enable the Event Notification App. It is disabled by default. Within its settings, you can choose which kinds of events you're interested in. We typically monitor: dropped, bounced, unsubscribe, and spam.  Monitoring deferred events seemed to cause a lot of noise.

**Post Event URL:** https://yourserver.com/postSendGridMessage?apikey=a-valid-hipchat-api-key&room=a-valid-HipChat-room-number&environment=a-string-of-your-choosing
