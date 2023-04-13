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
const defaultConfig = '$MOCKCONFIG$';
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
  .command('*')
  .description('Unmatched command')
  .action(function() {
    program.outputHelp();
  });

program.parse(process.argv);

// Show help when no commands and args provided
if (!process.argv.slice(2).length) {
  // program.outputHelp();
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
function setConfig(file: string = defaultConfig): void {
  const prefix = 'export const environment = ';
  environment.mockConfig = file;
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
  // console.log(config);
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
    setConfig(defaultConfig);
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
            setConfig(command.config);
          }
          break;
        }
      }
    }
  }

  console.log(outputMessage);
}
