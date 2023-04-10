#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');

program
  .option('-i, --ip <ip_address>', 'Sets IP address of your server')
  .parse(process.argv);

const proxyConfigJson = './proxy.config.json';
const environmentTs = './src/environments/environment.ts';
const url = normalizeUrl(program.ip);

printCurrentConfig();
console.log(''); // New line.

if (!url) {
  program.outputHelp();
  process.exit(2);
}

copySkel(proxyConfigJson);
copySkel(environmentTs);
console.log('Changing to: ' + url);

function normalizeUrl(url = '') {
  const parts = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?([^:\/\n?]+)(?::([0-9]+))?/);

  if (!parts || !parts.length) {
    return;
  }

  let normalizedUrl = parts[1];
  if (parts[2]) {
    normalizedUrl = normalizedUrl + ':' + parts[2];
  }

  return normalizedUrl;
}

function copySkel(file) {
  const data = fs.readFileSync(file + '.skel', 'utf8');
  const result = data.replace(/\$SERVER\$/g, url);
  fs.writeFileSync(file, result, 'utf8');
}

function printCurrentConfig() {
  const doesConfigExist = fs.existsSync(proxyConfigJson);
  if (!doesConfigExist) {
    console.log('No current config set.');
    return;
  }
  const data = fs.readFileSync(environmentTs, 'utf8');
  const url = data.match(/remote: '([^']+)'/);
  console.log('Current server: ' + url[1]);
}
