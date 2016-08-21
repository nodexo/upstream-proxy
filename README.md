
Upstream Proxy
==============

Virtual host your apps: Upstream Proxy routes incoming requests - based on their host header - to (node.js) apps in the backend.

### It works with all kinds of web traffic...

* HTTP
* TLS (HTTPS)
* HTTP/2
* WebSocket
* Server-Sent Events

### ...and is optimized for

* ease of use *(by providing a clean API)*
* speed *(by keeping things lean and simple :)*

Plug it to an NGINX upstream (via TCP port or IPC socket), connect it to any other service - or expose it directly to the internet (port 80 and 443). 

In the future there will be [examples](https://github.com/nodexo/upstream-proxy/tree/master/examples) covering most use cases.


Installation
------------

    npm install upstream-proxy --save


Usage
-----
Example:
```javascript
  const upstreamProxy = require('upstream-proxy');

  let config = {
    frontend_connectors: [
      {
        host_headers: ['127.0.0.1', 'localhost'],
        target: 'local-website'
      }
    ],
    backend_connectors: [
      { 
          name: 'local-website',
          endpoints: {
              tcp: { host: '127.0.0.1', port: 3001 }
          }
      }
    ]
  }

  let proxy = new upstreamProxy(config).listen(3000);
```


API
---

### Configuration

The configuration is done by passing an object consisting of two arrays:
* an array of objects describing the frontend connectors 
* an array of objects describing the backend connectors

```javascript
{
  frontend_connectors: [],
  backend_connectors:  []
}
```

...
...
...

**More is coming soon - I really work hard on it...**



Further Information
-------------------

### Serving the web

In a classic [NGINX](https://www.nginx.com/resources/wiki/) or [Apache](https://httpd.apache.org/) web server configuration, you would use [virtual hosting](https://en.wikipedia.org/wiki/Virtual_Hosting) to host multiple apps/sites on a single IP address. But this is complicated and troublesome to configure and
to automate.

Proxying requests through Upstream Proxy to multiple Node.js processes is my favorite route to go, because it allows me to...
* write apps that are simple to test and develop because they're stand alone. All they need to know for proper operation is the appropriate endpoint for listening.
* do hassle-free on-the-fly configuration of routes
* apply monitoring and clustering via process manager (e.g. [PM2](http://pm2.keymetrics.io/)) - and not by the web server itself
* reload or restart single apps

Upstream Proxy is purpose built: It takes the place of a regular web server when you don't need it for anything else except proxying requests.
When you want to plug it into an NGINX upstream otherwise and let it route the requests: you are fine - the configuration is much simpler and you get **Javascript truly all the way down**.

FYI, there's no reason you can't use Upstream Proxy as a gateway to non-Node.js apps or services.



### TLS (HTTPS) and HTTP/2

[SNI](https://en.wikipedia.org/wiki/Server_Name_Indication) is supported for detecting the hostname of a secure request.
[Today all modern browsers support SNI.](http://caniuse.com/#feat=sni)

Upstream Proxy does not need to know about your certificates. It peeks at the TLS/SNI extension headers (which are not encrypted) and forwards the encrypted data as-is. There is no need to read or modify the encrypted payload.


### WebSocket(s)

They just work!

The initial negotation of for a [WebSocket](https://en.wikipedia.org/wiki/WebSocket) is done via HTTP(S), so Upstream Proxy routes it normally. Once a socket has been established, data is passively/transparently piped between the upstream and downstream sockets, including all WebSocket negotiation and data.

The same applies to [Server-Sent Events](https://en.wikipedia.org/wiki/Server-sent_events).


Benchmarks
----------

There are none published yet (internally I have done a lot of testing...).

If you create one and want to share, I would be happy to include some.
