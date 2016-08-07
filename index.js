
const net = require('net');

function UpstreamProxy(routes) {
  console.log('Server Successfully Created');
  return net.createServer( (socket) => this.handleConnection(socket, routes) );
}

UpstreamProxy.prototype.handleConnection = (socket, routes) => {
    //to come... :)
}

module.exports = UpstreamProxy;
