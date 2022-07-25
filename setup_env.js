#!/usr/bin/env node

var program = require('commander');

program
  .option('-i, --ip <ip_address>', 'IP address of your server')
  .parse(process.argv);

var proxy_config_json = './proxy.config.json';
var environment_ts = './src/environments/environment.ts';
var hostname = (program.ip || '').match(/^(?:https?:\/\/)?(?:[^@\n]+@)?([^:\/\n?]+)(?::([0-9]+))?/);

if (!hostname || !hostname[1]) {
  program.outputHelp();
  process.exit(2);
}

var copySkel = function(file) {
  var fs = require('fs')
  fs.readFile(file + '.skel', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    let url = hostname[1];
    if (hostname[2]) {
      url = url + ':' + hostname[2];
    }

    const result = data.replace(/\$SERVER\$/g, url);

    fs.writeFile(file, result, 'utf8', function (err) {
       if (err) return console.log(err);
    });
  });
}

copySkel(proxy_config_json);
copySkel(environment_ts);
