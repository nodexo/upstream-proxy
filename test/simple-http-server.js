
const http = require('http');

const tcp_host = '127.0.0.1';
const tcp_port = 3001;

const prefix = process.platform === 'win32' ? '//./pipe/' : '/tmp/';
const ipc = prefix + tcp_host.replace(/\./g, '-') + '-' + tcp_port;

function handleRequest(request, response) {
  response.end('OK');
}

console.log('\nSimple web server listening at:');

http.createServer(handleRequest).listen(tcp_port, tcp_host, function () {
  console.log('http://' + tcp_host + ':' + tcp_port);
});

http.createServer(handleRequest).listen(ipc, function () {
  console.log(ipc);
});
