
'use strict';

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
    console.log( `Config set: ${result} @ ${proxy.getConfig().created_at}` );
  });
}

proxy.listen(PORT, () => {
  console.log( `\nProxy ist listening on port ${PORT}.` );
  setConfigFromFile();
}).start();

chokidar.watch(configFile).on('change', (event, path) => {
  setConfigFromFile();
});
