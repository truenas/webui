#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');

program
  .option('-f, --file <path>', 'Load config file (other flags will be ignored)')
  .parse(process.argv);

const environmentTs = './src/environments/environment.ts';
setAttribute(program.file);

function setAttribute(file) {
  const data = fs.readFileSync(environmentTs, 'utf8');
  const result = data.replace(/\$MOCKCONFIG\$/g, file);

  console.log('Data:\n');
  console.log(data);
  console.log('****************************');
  console.log('Result:\n');
  console.log(result);

  fs.writeFileSync(environmentTs, result, 'utf8');
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
