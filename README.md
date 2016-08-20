
# upstream-proxy

Upstream proxy routes incoming requests - based on their host headers - to any app in the backend.

It supports all kinds of traffic like
* http
* https (SSL/TLS)
* http/2
* WebSockets
* Server Sent Events (SSE)

Incoming requests may come from nginx upstream any other service that is able to forward via IPC socket or TCP port.
If you know what you are doing, you can also expose upstream proxy directly to the internet. 
See more in the upcoming ['/examples'-section](https://github.com/nodexo/upstream-proxy/examples/).

## Installation
```shell
  npm install upstream-proxy --save
```

## Usage
```javascript
  const UpstreamProxy = require('upstream-proxy');

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

  let proxy = new UpstreamProxy(config).listen(3000);
```
## Development
If you want to contribute, do tests etc. please 
read the [devnotes](https://github.com/devsparks/html-specialchars/blob/master/devnotes.md).


## Release History
* 1.0.0 ...to come in September 2016
