
Upstream Proxy
==============

Virtual host your apps: Upstream Proxy routes incoming requests - based on their host header - to (node.js) apps in the backend.

**It works with all kinds of traffic...**
* HTTP
* TLS (HTTPS)
* HTTP/2
* WebSocket
* Server-Sent Events

**...and is optimized for**
* ease of use *(by providing a clean API)*
* speed *(by keeping things lean and simple :)*

Plug it to the nginx upstream (via TCP port or IPC socket), connect it to other services or expose it directly to the internet (e.g. port 80 and 443). 
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


**More is coming soon - I really work hard on it...**




Further Information
-------------------

### TLS (HTTPS) and HTTP/2

[SNI](http://en.wikipedia.org/wiki/Server_Name_Indication) is supported for detecting the hostname of a secure request.
[Today all modern browsers support SNI.](http://caniuse.com/#feat=sni)

Upstream Proxy does not need to know about your certificates. It peeks at the TLS/SNI extension headers (which are not encrypted) and forwards the encrypted data as-is. There is no need to read or modify the encrypted payload.


### WebSocket(s)

They just work!

The initial negotation of for a [WebSocket](http://en.wikipedia.org/wiki/WebSocket) is done via HTTP(S), so Upstream Proxy routes it normally. Once a socket has been established, data is passively/transparently piped between the upstream and downstream sockets, including all WebSocket negotiation and data.

The same applies to [Server-Sent Events](https://en.wikipedia.org/wiki/Server-sent_events).


Benchmarks
----------

There are none published yet (internally I have done a lot of testing :).

If you create one and want to share, I would be happy to include some.
