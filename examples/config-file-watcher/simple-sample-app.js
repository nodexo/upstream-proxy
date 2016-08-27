
const http = require('http');

const prefix = process.platform === 'win32' ? '//./pipe/' : '';
const endpoints = {host: '127.0.0.1', port: 3001, path: '/tmp/3001.sock'};
endpoints.path = prefix + endpoints.path;


function handleRequestTCP(request, response) {
  response.end('TCP');
}

function handleRequestIPC(request, response) {
  response.end('IPC');
}

console.log('\nSimple sample app listening at:');

http.createServer(handleRequestTCP).listen({port: endpoints.port, host: endpoints.host}, function () {
  console.log( `http://${endpoints.host}:${endpoints.port}` );
});

http.createServer(handleRequestIPC).listen({path: endpoints.path}, function () {
  console.log(endpoints.path);
});
