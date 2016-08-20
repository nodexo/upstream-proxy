
const UpstreamProxy = require('./index');

/*
var config = {
    host_headers: {
      '127.0.0.1': 'website',
      'localhost': 'website',
      'localhost.nodexo.de': 'website_ssl'
    },
    backends: {
      website: {
        ipc: '127-0-0-1-3001',
        tcp: {host: '127.0.0.1', port: 3001}
      },
      website_ssl: {
        tcp: {host: '127.0.0.1', port: 8001}
      }
    }
} */

var config = {
    frontend_connectors: [
      {
        host_headers: ['127.0.0.1', 'localhost'],
        target: 'website'
      },
      {
        host_headers: ['localhost.nodexo.de'],
        target: 'website_ssl'
      }
    ],
    backend_connectors: [
      { 
          name: 'website',
          endpoints: {
              ipc: '127-0-0-1-3001',
              tcp: { host: '127.0.0.1', port: 3001 }
          }
      },
      {
          name: 'website_ssl',
          endpoints: {
            tcp: { host: '127.0.0.1', port: 8001 }
          }
      }
    ]
}


var smallConfig = {
    host_headers: {
      '127.0.0.1': 'website'
    },
    backends: {
      website: {
        ipc: '127-0-0-1-3001',
      }
    }
}

//config = {};

var proxy = new UpstreamProxy(config);
proxy.listen(3000);

/*
setInterval(function() {
  try {
    console.log(Object.keys(connections.sockets).length);
    console.log(sockets.size);
    console.log('');
  } 
  catch(e) {}
}, 5000);
*/

/*
setTimeout(function() {
  console.log( proxy.setConfig(smallConfig) );
}, 5000);

setTimeout(function() {
  console.log( proxy.getConfig() );
}, 5100);
*/

/*
setTimeout(function() {
  console.log( proxy.stop() );
}, 5000);
*/

//console.log( proxy.getConfig() );

let routes = proxy.getRoutes();
console.log( routes instanceof Map );

//console.log( proxy.setConfig({ blah: 'OK'}) );
//console.log( proxy.getConfig() );
//console.log( proxy.getRoutes() );

/*
console.log( proxy.start() );
console.log( proxy.stop() );
console.log( proxy.start() );
*/