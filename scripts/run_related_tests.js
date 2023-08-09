#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Please provide at least one file path as an argument.');
  process.exit(1);
}

const filePaths = process.argv.slice(2).map(filePath => {
  // Replace the file extension with `.ts`
  return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.ts');
});

const command = './node_modules/.bin/jest';
const jestProcess = spawn(command, ['--passWithNoTests', '--bail', '--findRelatedTests', ...filePaths]);

jestProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

jestProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

jestProcess.on('close', (code) => {
  process.exit(code);
});
