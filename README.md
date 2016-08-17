
# upstream-proxy

Upstream proxy routes incoming requests - based on their host headers - to node.js apps or any other configured service.

Incoming requests may come
* from nginx upstream
* directly from the internet (e.g. on TCP ports 80 and 443)
* from any other service forwarding via IPC socket or TCP port

Backends can be
* node.js apps listening on TCP ports
* node.js apps listening on IPC sockets 
  ('named pipes' on Windows)
* any other software or app listening as described above

It works for
* http
* https (SSL/TLS)
* http/2
* websockets
* server sent events (SSE)/event source
