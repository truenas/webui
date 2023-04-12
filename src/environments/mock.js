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
  const prefix = 'export const environment = ';
  const converted = data.replace(prefix, ''); // Remove export statement to make it JS

  eval('var environment = '+converted);
  environment.mockConfig = file;
  const result = makePrintable(environment, prefix);

  console.log('Data:\n');
  console.log(environment);
  console.log('****************************');
  console.log('Result:\n');
  console.log(result);

  fs.writeFileSync(environmentTs, result, 'utf8');
}

function makePrintable(src, prefix) {
  const keys = Object.keys(src);
  let output = prefix + '{\n';
  
  keys.forEach((key) => {
    output += '  ' + key + ': ' + wrap(key, src[key]) + ',\n';
  });
  
  output += '}\n';

  return output;
}

function wrap(key, value) {
  if (typeof value === 'string'){
    return '\'' + value + '\'';
  } else {
    return value;
  }
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
