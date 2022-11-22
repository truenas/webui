#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');

program
  .option('-i, --ip <ip_address>', 'IP address of your server')
  .parse(process.argv);

const proxyConfigJson = './proxy.config.json';
const environmentTs = './src/environments/environment.ts';
const hostname = (program.ip || '').match(/^(?:https?:\/\/)?(?:[^@\n]+@)?([^:\/\n?]+)(?::([0-9]+))?/);

if (!hostname || !hostname[1]) {
  program.outputHelp();
  process.exit(2);
}

const copySkel = function(file) {
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

copySkel(proxyConfigJson);
copySkel(environmentTs);
