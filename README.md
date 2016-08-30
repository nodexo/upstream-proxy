
Upstream Proxy
==============

Route requests to Node.js apps by hostname.

Plug it to an NGINX upstream, connect it to any other service - or expose it directly to the internet (port 80 and 443). 

<a href="https://raw.githubusercontent.com/nodexo/upstream-proxy/master/img/upstream-proxy-standalone.png"><img src="https://raw.githubusercontent.com/nodexo/upstream-proxy/master/img/upstream-proxy-standalone-preview.png" alt="Upstream Proxy standalone" width="125" /></a>
<a href="https://raw.githubusercontent.com/nodexo/upstream-proxy/master/img/nginx-upstream-proxy.png"><img src="https://raw.githubusercontent.com/nodexo/upstream-proxy/master/img/nginx-upstream-proxy-preview.png" alt="NGINX with Upstream Proxy" width="125" /></a>

### It works with all kinds of web traffic...

* HTTP
* TLS (HTTPS)
* HTTP/2
* WebSocket
* Server-Sent Events

### ...and is

* easy to use
* robust
* fast

In the future there will be [examples](https://github.com/nodexo/upstream-proxy/tree/master/examples) covering some use cases.


Installation
------------

    npm install upstream-proxy


Usage
-----
Basic example:
```javascript
const upstreamProxy = require('upstream-proxy');

let myConfig = [
    {
        name: 'app-1',
        hostnames: [ 'localhost' ],
        endpoint: { host: '127.0.0.1', port: 3001 }
    }
];

let proxy = new upstreamProxy(myConfig);
proxy.listen(3000).start();
```

If you want to catch all requests that don't match any given host name, 
you can use an asterisk:

```javascript
let myConfig = [
    ...
    ...
    ...
    {
        name: 'catch-all',
        hostnames: [ '*' ],
        endpoint: { host: '127.0.0.1', port: 3999 }
    }
];
```


API Methods
------------
- [start()](#start)
- [stop()](#stop)
- [getStatus()](#getstatus)
- [setConfig(obj)](#setconfigobj)
- [getConfig()](#getconfig)
- [getRoutes()](#getroutes)
- [setCallbacks(obj)](#setcallbacksobj)
- [getCallbacks()](#getcallbacks)
- [disconnectClients(str)](#disconnectclientsstr)
- [disconnectAllClients()](#disconnectallclients)


### start()

Starts the proxy.

Example:

```js
let result = proxy.start();

console.log( result );
// OK
```

Once created, the proxy listens for connections immediately.   
If nothing is configured, each request returns a "503 Service Unavailable" (see [getStatus()](#getstatus)).


### stop()

Stops the proxy.

Example:

```js
let result = proxy.stop();

console.log( result );
// OK
```

New requests will be answered with "503 Service Unavailable".  
Existing connections are NOT affected, to disconnect the clients use [disconnectAllClients()](#disconnectallclients).


### getStatus()

Gets current status.

Possible return values are:
- active => proxy routes incoming requests
- passive => each request returns a "503 Service Unavailable"

Example:

```js
let proxyStatus = proxy.getStatus();

console.log( proxyStatus );
// active
```


### setConfig(obj)

Sets the configuration and generates a routing map - completely overwrites current configuration and routes.  
Existing connections are not affected.

Example:

```js
const upstreamProxy = require('upstream-proxy');

let proxy = new upstreamProxy();
proxy.listen(3000).start();

let myConfig = [
    {
        name: 'app-1',
        hostnames: [ 'localhost' ],
        endpoint: { host: '127.0.0.1', port: 3001 }
    }
];

let result = proxy.setConfig(myConfig);

console.log( result );
// OK
```

### getConfig()

Gets the current configuration.

Example:

```js
let liveConfig = proxy.getConfig();

console.log( JSON.stringify(liveConfig, null, 2) );
/*
[
    {
        "name": "app-1",
        "hostnames": [ "localhost" ],
        "endpoint": { "host": "127.0.0.1", "port": 3001 }
    }
]
*/
```

### getRoutes()

Gets the current routing map.

Example:

```js
let liveRoutes = proxy.getRoutes();

//liveRoutes is of type Map()
console.log( JSON.stringify([...liveRoutes], null, 2) ); 
/*
[
  [ "localhost", { "host": "127.0.0.1", "port": 3001 } ]
]
*/
```

### setCallbacks(obj)

Sets callbacks (hooks) for individual error handling.

Example:

```js
let myError503 = (socket, host_header) => {
  // individual error handling
}

let myCallbacks = {
  503: myError503
}

let result = proxy.setCallbacks(myCallbacks);

console.log( result );
// OK
```

Here, each request that normally would be closed by the proxy with a HTTP status 503 is handed back 
to "myError503" - passing back the socket object and the host name string. Now it's your responsibility 
to handle the request, for example:

```js
let htmlPage = "<h1>I'm on vacation at the moment - please try again later...</h1>";

socket.end('HTTP/1.1 503 Service Unavailable\r\n\r\n' + htmlPage);
```

### getCallbacks()

Gets currently configured callbacks.

Example:

```js
let liveCallbacks = proxy.getCallbacks();

console.log( JSON.stringify(liveCallbacks, null, 2) );
/*
{
  503: myError503
}
*/
```

### disconnectClients(str)

Disconnects clients for the specified host name, returns the number of terminated connections.  

Example:

```js
let nr = proxy.disconnectClients("localhost");

console.log( nr );
// 7
```



### disconnectAllClients()

Disconnects all clients, returns the number of terminated connections.

Example:

```js
let nr = proxy.disconnectAllClients();

console.log( nr );
// 102
```


Further Information
-------------------

### Serving the web

In a classic [NGINX](https://www.nginx.com/resources/wiki/) or [Apache](https://httpd.apache.org/) web server configuration you would use [virtual hosting](https://en.wikipedia.org/wiki/Virtual_Hosting) to host multiple apps/sites on a single IP address. But this is complicated and troublesome to configure/automate.

Proxying requests through Upstream Proxy to multiple Node.js processes is my favorite route to go, because it allows me to...
* write apps that are simple to develop and test - because they're stand alone. All they need to know for proper operation is an endpoint for listening.
* do hassle-free configuration of routes
* apply monitoring and clustering to my apps via process manager (e.g. [PM2](http://pm2.keymetrics.io/)) - avoid using a web server for it!
* intentionally reload or restart single apps

Upstream Proxy is purpose built: It takes the place of a regular web server when you don't need it for anything else except proxying requests.
If you want to plug it into an NGINX upstream for routing requests you are fine too - the configuration is much simpler and you get **Javascript truly all the way down**.

FYI: There is no reason you can't use Upstream Proxy as a gateway to non-Node.js apps or services.



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
