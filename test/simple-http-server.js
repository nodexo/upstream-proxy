
const http = require('http');

const tcp_host = '127.0.0.1';
const tcp_port = 3001;
const ipc_path = '/tmp/3001.sock';

const ipc_prefix = process.platform === 'win32' ? '//./pipe/' : '';
const ipc = ipc_prefix + ipc_path;

function handleRequestTCP(request, response) {
  response.end('TCP');
}

function handleRequestIPC(request, response) {
  response.end('IPC');
}

console.log('\nSimple web server listening at:');

http.createServer(handleRequestTCP).listen(tcp_port, tcp_host, function () {
  console.log('http://' + tcp_host + ':' + tcp_port);
});

http.createServer(handleRequestIPC).listen(ipc, function () {
  console.log(ipc);
});
