
'use strict';

/**
 * Imports
 * ...wait for v8 to implement es6 style
 * import net from 'net';
 * import sni from 'sni';
*/
const net = require('net');
const sni = require('sni');

/**
 * Creates a new upstream proxy instance.
 * @class
 */
class UpstreamProxy {

  /**
    * @constructs UpstreamProxy server
    * @param {object} config sets frontend and backend connectors for calculating the routes
    * @return {object}
    */
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

    this.routes = this._generateRoutesMap(config);

    let server = net.createServer((socket) => this._handleConnection(socket));
    server.start = () => this.start();
    server.stop = () => this.stop();
    server.getConfig = () => this.getConfig();
    server.setConfig = (config) => this.setConfig(config);
    server.getRoutes = () => this.getRoutes();
    server.disconnectClients = (host) => this.disconnectClients(host);
    server.disconnectAllClients = () => this.disconnectAllClients();

    return server;
  }

  /**
   * Handles connections from frontend
   * @param {object} socket
   */
  _handleConnection(socket) {
    if (!this.active) {
      return socket.end(this._httpResponse(503));
    }

    socket.once('error', (err) => {
      //console.log(err);
      socket.end();
    });

    socket.once('data', (data) => this._handleData(socket, data));
  }

  /**
   * Handles data from connection handler
   * @param {object} socket
   * @param {buffer} data
   */
  _handleData(socket, data) {
    if (data instanceof Buffer === false || data.length < 1) {
      return socket.end(this._httpResponse(400));
    }

    const host_header = this._getHostHeader(data);
    let route;
    try {
      route = this.routes.get(host_header);
    }
    catch (e) {
      return socket.end(this._httpResponse(404));
    }

    let backend = new net.Socket();

    backend.once('error', (err) => {
      backend.destroy();
      if (typeof this[route.cb] === 'function') {
        this[route.cb](socket, host_header);
      } else {
        socket.end(this._httpResponse(503));
      }
    });

    backend.on('connect', () => {
      this._addConnection(socket, host_header);
      socket.on('error', () => { this._removeConnection(socket, backend); });
      backend.on('close', () => { this._removeConnection(socket, backend); });
      backend.write(data);
      socket.pipe(backend).pipe(socket);
    });

    if (route.ipc) {
      backend.connect(route.ipc);
    } else if (route.tcp) {
      backend.connect(route.tcp);
    } else {
      return socket.end(this._httpResponse(502));
    }
  }

  /**
   * Extracts hostname from buffer
   * @param {buffer} data
   * @return {string}
   */
  _getHostHeader(data) {
    if (data[0] === 22) { //secure
      return this.routes.get(sni(data));
    } else {
      let result = data.toString('utf8').match(/^(H|h)ost: ([^ :\r\n]+)/im);
      if (result) {
        return result[2];
      }
    }
  }

  /**
   * Adds socket to internal frontend connection tracking
   * @param {object} socket
   * @param {string} host_header
   */
  _addConnection(socket, host_header) {
    this.id++;
    socket[this.symId] = this.id;
    socket[this.symHostHeader] = host_header;
    this.host_headers[host_header].set(this.id, true);
    this.sockets.set(this.id, socket);
    //console.log('Added: ' + socket[this.symId] + '@' + socket[this.symHostHeader]);
  }

  /**
   * Removes socket from internal frontend connection tracking
   * @param {object} socket
   * @param {object} backend
   */
  _removeConnection(socket, backend) {
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

  /**
   * Generates routes map
   * @param {object} config
   * @return {map}
   */
  _generateRoutesMap(config) {
    let endpoints = this._generateEndpointsMap(config.backend_connectors);
    let routes = new Map();
    for (let fc of config.frontend_connectors || []) {
      for (let hh of fc.host_headers) {
        routes.set(hh, endpoints.get(fc.target));
        this.host_headers[hh] = new Map();
      }
    }
    return routes;
  }

  /**
   * Generates endpoints map
   * @param {array} backend_connectors
   * @return {map}
   */
  _generateEndpointsMap(backend_connectors = []) {
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

  /**
   * Closes frontend connections
   * @param {array} list_of_ids
   * @return {number}
   */
  _closeFrontendConnections(list_of_ids) {
    let i = 0;
    for (let id of list_of_ids) {
      try {
        this.sockets.get(id).end();
        this.sockets.delete(id);
        i++;
      } catch (e) {
        console.log(e);
      }  
    }
    return i;
  }

  /**
   * Generates client response
   * @param {number} nr
   * @return {string}
   */
  _httpResponse(nr) {
    let reason_phrase = this.status_codes.get(nr);
    if (!reason_phrase) {
      return 'HTTP/1.1 500 Internal Server Error\r\n\r\n';
    }
    return 'HTTP/1.1 ' + nr + ' ' + reason_phrase + '\r\n\r\n';
  }

  /**
   * Returns current configuration
   * @return {object}
   */
  getConfig() {
    return this.config;
  }

  /**
   * Sets new configuration
   * @param {object} config
   */
  setConfig(config) {
    try {
      this.routes = this._generateRoutesMap(config);
      this.config = config;
      return 'OK';
    } catch (e) {
      return 'ERROR: ' + e.message;
    }
  }

  /**
   * Returns current routes
   * @return {map}
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Starts the service
   * @return {string}
   */
  start() {
    this.active = true;
    return 'OK';
  }

  /**
   * Stops the service
   * @return {string}
   */
  stop() {
    this.active = false;
    return 'OK';
  }

  /**
   * Disconnect all clients for a host(name)
   * @param {string} host
   * @return {number}
   */
  disconnectClients(host) {
    try {
      return this._closeFrontendConnections( Array.from( this.host_headers[host].keys() ) );
    } catch (e) {
      console.log(e);
      return 0;
    }
  }

  /**
   * Disconnect all clients
   * @return {number}
   */
  disconnectAllClients() {
    try {
      return this._closeFrontendConnections( Array.from( this.sockets.keys() ) );
    } catch (e) {
      return 0;
    }
  }

}

/**
 * Export
 * ...wait for v8 to implement es6 style:
 * export default UpstreamProxy;
*/
module.exports = UpstreamProxy;
