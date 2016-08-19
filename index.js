
'use strict';

/**
    Wait for v8 to implement es6 imports:
    import net from 'net';
    import sni from 'sni';
*/

const net = require('net');
const sni = require('sni');

class UpstreamProxy {

  constructor(config) {

    this.config = config;

    this.active = true;
    this.id = 0;
    this.symId = Symbol('id');
    this.symHostHeader = Symbol('host_header');
    this.host_headers = {};
    this.sockets = new Map();

    this.status_codes = new Map([
      [400, 'Bad Request'],
      [404, 'Not Found'],
      [500, 'Internal Server Error'],
      [502, 'Bad Gateway'],
      [503, 'Service Unavailable']
    ]);

    this.routes = this.generateRoutes(config);

    let server = net.createServer((socket) => this.handleConnection(socket));
    server.start = () => this.start();
    server.stop = () => this.stop();
    server.getConfig = () => this.getConfig();
    server.setConfig = (config) => this.setConfig(config);
    server.getRoutes = () => this.getRoutes();
    server.closeFrontendConnections = (host_header) => this.closeFrontendConnections();
    server.closeAllFrontendConnections = () => this.closeAllFrontendConnections();

    return server;
  }

  handleConnection(socket) {
    if (!this.active) {
      return socket.end(this.httpResponse(503));
    }

    socket.once('error', (err) => {
      //console.log(err);
      socket.end();
    });

    socket.once('data', (data) => this.handleData(socket, data));
  }

  handleData(socket, data) {
    if (data instanceof Buffer === false || data.length < 1) {
      return socket.end(this.httpResponse(400));
    }

    const host_header = this.getHostHeader(data);
    const route = this.routes[host_header];

    if (!route) {
      return socket.end(this.httpResponse(404));
    }

    let backend = new net.Socket();

    backend.once('error', (err) => {
      socket.end(this.httpResponse(503));
      backend.destroy();
    });

    backend.on('connect', () => {
      this.addConnection(socket, host_header);
      socket.on('error', () => { this.removeConnection(socket, backend); });
      backend.on('close', () => { this.removeConnection(socket, backend); });
      backend.write(data);
      socket.pipe(backend).pipe(socket);
    });

    if (route.ipc) {
      backend.connect(route.ipc);
    } else if (route.tcp) {
      backend.connect(route.tcp);
    } else {
      return socket.end(this.httpResponse(502));
    }
  }

  getHostHeader(data) {
    if (data[0] === 22) { //secure
      return this.routes[sni(data)];
    } else {
      let result = data.toString('utf8').match(/^(H|h)ost: ([^ :\r\n]+)/im);
      if (result) {
        return result[2];
      }
    }
  }

  addConnection(socket, host_header) {
    this.id++;
    socket[this.symId] = this.id;
    socket[this.symHostHeader] = host_header;
    this.host_headers[host_header].set(this.id, true);
    this.sockets.set(this.id, socket);
    //console.log('Added: ' + socket[this.symId] + '@' + socket[this.symHostHeader]);
  }

  removeConnection(socket, backend) {
    //if (this.sockets[socket[this.symId]]) {
    //console.log('Removed: ' + socket[this.symId] + '@' + socket[this.symHostHeader]);
    this.host_headers[socket[this.symHostHeader]].delete(socket[this.symId]);
    this.sockets.delete(socket[this.symId]);
    socket.end();
    socket.unref();
    //}
    //if (backend) {
    backend.end();
    //}
  }

  generateRoutes(config) {
    let endpoints = this.generateEndpointsMap(config.backend_connectors);
    let routes = {};
    for (let fc of config.frontend_connectors || []) {
      for (let hh of fc.host_headers) {
        routes[hh] = endpoints.get(fc.target);
        this.host_headers[hh] = new Map();
      }
    }
    return routes;
  }

  generateEndpointsMap(backend_connectors = []) {
    let endpoints = new Map();
    let prefix = process.platform === 'win32' ? '//./pipe/' : '/tmp/';
    for (let bc of backend_connectors) {
      if (bc.endpoints.ipc) {
        bc.endpoints.ipc = prefix + bc.endpoints.ipc;
      }
      endpoints.set(bc.name, bc.endpoints);
    }
    return endpoints;
  }

  httpResponse(nr) {
    let reason_phrase = this.status_codes.get(nr);
    if (!reason_phrase) {
      return 'HTTP/1.1 500 Internal Server Error\r\n\r\n';
    }
    return 'HTTP/1.1 ' + nr + ' ' + reason_phrase + '\r\n\r\n';
  }

  getConfig() {
    return this.config;
  }

  setConfig(config) {
    this.config = config;
    this.routes = this.generateRoutes(config);
    return 'OK';
  }

  getRoutes() {
    return this.routes;
  }

  start() {
    this.active = true;
    return 'OK';
  };

  stop() {
    this.active = false;
    return 'OK';
  };

  closeFrontendConnections(host_header) {
    //return nr of closed connections
    return 'Not Yet Implemented';
  }

  closeAllFrontendConnections() {
    //return nr of closed connections
    return 'Not Yet Implemented';
  }

}

/**
    Wait for v8 to implement es6 exports:
    export default UpstreamProxy;
*/
module.exports = UpstreamProxy;
