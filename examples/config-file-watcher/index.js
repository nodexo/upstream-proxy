
'use strict';
const HTTPParser = require('http-parser-js').HTTPParser;
const fs = require('fs');
const upstreamProxy = require('upstream-proxy');
const chokidar = require('chokidar');

const PORT = 3000;
const configFile = './config.json';

let proxy = new upstreamProxy();

let setConfigFromFile = () => {
  fs.readFile(configFile, 'utf8', (err, data) => {
    if (err) throw err;
    let result = proxy.setConfig( JSON.parse(data) );
    console.log( `Config set: ${result}` );
  });
}

proxy.listen(PORT, () => {
  console.log( `\nWebserver (USP) ist listening on port ${PORT}.` );
  setConfigFromFile();
}).start();

chokidar.watch(configFile).on('change', (event, path) => {
  setConfigFromFile();
});

proxy.on('data', data => {
  const parser = new HTTPParser(HTTPParser.RESPONSE);
  parser.onHeadersComplete = (res) => {
    // console.log(res.headers);
  }

  parser.onBody = (chunk, start, len) => {
    console.log(`${chunk.toString('utf8', start, start + len)}`);
  }

  parser.onMessageComplete = () => {
    // console.log('\nDone');
  }

  try {
    parser.execute(data, 0, data.length);
  } catch (e) {
    console.log(e);
  }


});

