/* eslint-disable */
import { environment } from './environment';
import { environmentTemplate } from './environment.template';
import { Command } from 'commander';
import * as fs from 'fs';
import {EnclosureDispersalStrategy} from "../app/core/testing/enums/mock-storage.enum";
const figlet = require("figlet");
import { WebUiEnvironment } from "./environment.interface";

interface CommandOptions {
  [p: string]: any;
}


/*
* Nice Header
* */
function showBanner(): void {
  console.log(figlet.textSync('TrueNAS WebUI'));
}

/*
* Variables
* */
const environmentTs = './src/environments/environment.ts';
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
    showBanner();
    program.help();
  });

program.parse(process.argv);

// Show help when no commands and args provided
if (!process.argv.slice(2).length) {
  showBanner();
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
  const imports = `/* eslint-disable no-restricted-imports */
import { EnclosureDispersalStrategy } from "../app/core/testing/enums/mock-storage.enum";
import { WebUiEnvironment } from "./environment.interface";\n
`

  const prefix = 'export const environment: WebUiEnvironment = ';
  const result = makePrintable(environment, imports + prefix);

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

function enumAsString(value: string): string | null {
  const trimmed = value.replace(/\"|\: /g, '');
  let output: string;
  for (const key in EnclosureDispersalStrategy) {
    if (key.toLowerCase() === trimmed) {
      output =  ': EnclosureDispersalStrategy.' + key;
    }
  }

  return output ? output : value.replace(/\"/g, '\'');
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
    default: {
      if (key === 'mockConfig') {
        const regexBefore = /\".*\"\:/g;
        const regexAfter = /\: \".*\"/g;
        const pretty = JSON.stringify(value, null, "    ")
          .replace(regexBefore, (match) => {
            return match.replace(/\"/g, '');
        }).replace(regexAfter, (match) => {
            const converted = enumAsString(match);
            return converted;
          }).replace(/\"/g, '\'');

        return pretty;
      }
    }
  }
}

/*
* Mock Command
* */
function mockConfigReport(file: string): string {
  const output = `
  ******** MOCK CONFIGURATION DETAILS ********

  * Config file: ${file}
  * Controller: ${environment.mockConfig.systemProduct}
  * Shelves: ${environment.mockConfig.enclosureOptions.expansionModels}
  * Slot Assignment: ${environment.mockConfig.enclosureOptions.dispersal}

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
    showBanner();
    command.help();
  } else if (command.reset) {
    environment.mockConfig = environmentTemplate.mockConfig;
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
            console.log('Locating mock configuration file...');
            const path = 'src/assets/mock/configs/';
            const configStr = fs.readFileSync( path + command.config, 'utf8');
            const config = JSON.parse(configStr);

            environment.mockConfig = config;
            console.log('Mock config file found √');

            let mockConfig = mockConfigReport(command.config);
            console.log(mockConfig);
            environment.mockConfig = command.config ? config : null;
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
    showBanner();
    command.help();
    process.exit(2);
  }

  saveProxyConfig(proxyConfigJson, url);
  environment.remote = url;
  showRemote();
  saveEnvironment();
}
