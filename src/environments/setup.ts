/* eslint-disable */
import { environment } from './environment';
import { Command } from 'commander';
import * as fs from 'fs';

export interface WebUiEnvironment {
  remote: string;
  port: number;
  production: boolean;
  sentryPublicDsn: string;
  mockConfig: string;
}

interface CommandOptions {
  [p: string]: any;
}


/*
* Variables
* */
const environmentTs = './src/environments/environment.ts';
const skel = './src/environments/environment.ts.skel';
const defaultMockConfig = '$MOCKCONFIG$';
const originalEnvironment = {...environment};

/*
* Command Setup
* */
const program: Command = new Command();
program
  .version('0.0.1')
  .description('WebUI setup utility')

program
  .command('mock')
  .description('Mocking enclosure ui support')
  .option('-r, --reset', 'Reset mock configuration option')
  .option('-d, --debug', 'debug output')
  .option('-c, --config <path>', 'load mock config file')
  .action(() => {
    const mockCommand = program.commands.find((command: Command) => command._name === 'mock');
    const mockOptions = commandOpts(mockCommand);
    mock(mockCommand, mockOptions);
  });

program
  .command('remote')
  .description('Set the server WebUI communicates with')
  .option('-i, --ip <ip_address>', 'Sets IP address of your server')
  .action(() => {
    const remoteCommand = program.commands.find((command: Command) => command._name === 'remote');
    const remoteOptions = commandOpts(remoteCommand);
    remote(remoteCommand, remoteOptions.ip);
  });

program
  .command('showremote')
  .description('Show the server WebUI communicates with')
  .action(() => {
    showRemote();
  });

program
  .command('*')
  .description('Unmatched command')
  .action(() => {
    program.help();
  });

program.parse(process.argv);

// Show help when no commands and args provided
if (!process.argv.slice(2).length) {
  program.help();
}

// How is this not built into command.js?
function commandOpts(command: Command): CommandOptions {
  const keys: string[] = command.options.map((option: any) => {
    const key = option.long.replace(/^--/ ,'');
    return key;
  });

  let options: CommandOptions = {};

  keys.forEach((key: string) => {
    if (command[key]) {
      options[key] = command[key];
    }
  });

  return options;
}

/*
* General environment file editing functions
* */
function saveEnvironment(): void {
  const prefix = 'export const environment = ';
  const result = makePrintable(environment, prefix);
  if (program.debug) debugOutput(result);
  fs.writeFileSync(environmentTs, result, 'utf8');

  console.log('WebUI environment updated with new settings');
}

function debugOutput(newConfig: string): void {
  console.log('Old Environment :\n');
  console.log(originalEnvironment);
  console.log('****************************');
  console.log('New Environment:\n');
  console.log(newConfig);
}

function makePrintable(src: WebUiEnvironment, prefix: string) {
  const keys = Object.keys(src);
  let output = prefix + '{\n';

  keys.forEach((key: keyof WebUiEnvironment) => {
    let value: any = src[key] as unknown;

    output += '  ' + key.toString() + ': ' + wrap(key.toString(), value) + ',\n';
  });

  output += '}\n';

  return output;
}

function wrap(key:string, value: any): string {
  switch(typeof value){
    case 'string':
    return '\'' + value + '\'';
    case 'boolean':
    case 'number':
    return value.toString();
    case 'undefined':
      console.error('Property not defined');
    default:
      console.log('WTF is this');
  }
}

/*
* Mock Command
* */
function mockConfigReport(file: string): string {
  const path = 'src/assets/mock/configs/';
  let output = '';

  console.log('Locating mock configuration file...');
  const configStr = fs.readFileSync( path + file, 'utf8');
  const config = JSON.parse(configStr);
  console.log('Mock config file found √')

  output += `
  ******** MOCK CONFIGURATION DETAILS ********

  * Config file: ${file}
  * Controller: ${config.systemProduct}
  * Shelves: ${config.enclosureOptions.expansionModels}
  * Slot Asssignment: ${config.enclosureOptions.dispersal}

  ********************************************

  `;
  return output;
}

function mockResetReport(): string {
  const output = `
  ******** MOCK CONFIGURATION UNSET ********
  `;
  return output;
}

function mock(command: Command, options: CommandOptions): void {
  console.log('Running mock utility...');
  let outputMessage = '';

  if (!options.reset && !options.config) {
    command.help();
  } else if (command.reset) {
    environment.mockConfig = defaultMockConfig;
    saveEnvironment();
    outputMessage += mockResetReport();
  } else {
    for (let option in options) {
      if (command.debug) {
        console.log({
          option: option,
          value: command[option],
        })
      }

      switch (option) {
        case 'debug':
        case 'reset':
          break;
        case 'config': {
          if (!command.reset) {
            let mockConfig = mockConfigReport(command.config);
            console.log(mockConfig);
            environment.mockConfig = command.config ? command.config : defaultMockConfig;
            saveEnvironment();
          }
          break;
        }
      }
    }
  }

  console.log(outputMessage);
}

/*
* Remote Command
* */
function normalizeUrl(url = ''): string {
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

function saveProxyConfig(file: string, url: string): void {
  const data = fs.readFileSync(file + '.skel' , 'utf8');
  const result = data.replace(/\$SERVER\$/g, url);
  fs.writeFileSync(file, result, 'utf8');
}

function printCurrentConfig(proxyConfigJson: string): void {
  const doesConfigExist = fs.existsSync(proxyConfigJson);
  if (!doesConfigExist) {
    console.log('No current config set.');
    return;
  }
}

function showRemote(): void {
  const output = `
  ******** REMOTE SERVER DETAILS ********

  * Server URL: ${environment.remote}

  ********************************************
  `

  console.log(output);
}

function remote(command: Command, ip: string): void {
  console.log('Setting remote machine url...');

  const proxyConfigJson = './proxy.config.json';
  const url = normalizeUrl(ip);

  printCurrentConfig(proxyConfigJson);

  if (!url) {
    command.help();
    process.exit(2);
  }

  saveProxyConfig(proxyConfigJson, url);
  environment.remote = url;
  showRemote();
  saveEnvironment();
}
