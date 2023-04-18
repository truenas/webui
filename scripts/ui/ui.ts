/* eslint-disable */
import {environment} from '../../src/environments/environment';
import {environmentTemplate} from './environment.template';
import {Command} from 'commander';
import fs from 'fs';
import {EnclosureDispersalStrategy} from "../../src/app/core/testing/enums/mock-storage.enum";
import {WebUiEnvironment} from "../../src/environments/environment.interface";
import inquirer from 'inquirer';
import {MockEnclosureConfig} from "../../src/app/core/testing/interfaces/mock-enclosure-utils.interface";

const figlet = require("figlet");

interface CommandOptions {
  [p: string]: any;
}

interface ReportOptions {
  data?: unknown;
  showHeader: boolean;
  showFooter: boolean;
}

interface Headers {
  header: string;
  footer: string;
}

interface ConfigWizardAnswers {
  fileName: string;
  controller: string;
  shelves: string;
  dispersal: string;
  loadAfterSave: string;
  saveOrCancel: string;
}


/*
* Nice Header
* */
function banner(): string {
  const content = figlet.textSync('TrueNAS WebUI');
  console.info(content);
  return content;
}

function generateHeaders(content: string): Headers {
  const width: number = 44;
  const start = '\n ';
  const finish = '\n';
  const asterisk = '*';
  const asterisksPerSide = (width - (content.length + 2)) / 2;
  const asterisks = asterisk.repeat(asterisksPerSide);
  const output = {
    header: start +asterisks + ' ' + content.toUpperCase() + ' ' + asterisks + finish,
    footer: start +asterisk.repeat(width) + '\n',
  }

  return output;
}


/*
* Variables
* */
const environmentTs = './src/environments/environment.ts';
const template = './scripts/ui/environment.template.ts';
const originalEnvironment = {...environment};
const modelsFile = './scripts/ui//models.json';
const models: CommandOptions = JSON.parse(fs.readFileSync(modelsFile, 'utf8'));

/*
* Command Setup
* */
const program: Command = new Command();
program
  .name('./ui')
  .version('0.0.1')
  .description('TrueNAS webui setup utility')
  .usage('(Call from root directory)')

program
  .command('mock')
  .description('Mocking enclosure ui support')
  .option('-e, --enable', 'enable mock config')
  .option('-d, --disable', 'disable mock config')
  .option('-M, --showcontrollers ', 'show available controllers for mock')
  .option('-S, --showshelves ', 'show available shelves for mock')
  .option('-m, --model <name>', 'set controller to mock')
  .option('-s, --shelves, [Array|null]', 'set expansion shelves to mock')
  .option('-a, --assign, <existing | default>', 'set slot assignment strategy')
  .option('-c, --config <filename>', 'load mock config file')
  .option('-r, --reset', 'Reset mock configuration to default values')
  .option('-l, --list', 'show current mock config settings')
  .option('-D, --debug', 'debug output')
  .action(() => {
    const mockCommand = program.commands.find((command: Command) => command._name === 'mock');
    const mockOptions = commandOpts(mockCommand);
    mock(mockCommand, mockOptions);
  });

program
  .command('mock-gen')
  .alias('mg')
  .description('Generates a mock config.json file')
  .action(() => {
    mockConfigWizard();
  })

program
  .command('reset')
  .description('Reset environment file to initial state')
  .action(() => {
    reset();
    process.exit(0);
    console.log(environment);

    showRemote({
      showHeader: true,
      showFooter: false,
    });
    mockConfigReport({
      showHeader: true,
      showFooter: true,
    });
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
    showRemote({
      showHeader: true,
      showFooter: true,
    });
  });

program
  .command('*')
  .description('Unmatched command')
  .action(() => {
    banner();
    program.help();
  });

program.parse(process.argv);

// Show help when no commands and args provided
if (!process.argv.slice(2).length) {
  banner();
  program.help();
}

// How is this not built into commander.js?
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

function showHelp(command: Command): void {
  banner();
  command.help();
}

/*
* Reset Environment File
* */
function reset(): void {
  const templateStr = fs.readFileSync( template, 'utf8');
  const result = templateStr.replace('const environmentTemplate', 'const environment');
  fs.writeFileSync(environmentTs, result, 'utf8');
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

function dispersalAsEnum(dispersal: string): EnclosureDispersalStrategy {
  if (dispersal.toLowerCase() === 'default' || dispersal.toLowerCase() === 'existing') {
    return EnclosureDispersalStrategy[capitalize(dispersal) as keyof EnclosureDispersalStrategy];
  } else {
    console.info(`ERROR: ${dispersal} is not a valid slot assignment`);
    process.exit(1);
  }
}

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1, text.length).toLowerCase();
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
          }).replace(/\"/g, '\'')
          .replace(/\'true\'/g, 'true')
          .replace(/\'false\'/g, 'false')

        return pretty;
      }
    }
  }
}

/*
* Mock Command
* */
function mockConfigReport(options: ReportOptions): string {
    if (!environment.mockConfig) {
      console.log('Something is wrong. Environment variable not initialized');
      console.log(environment);
      process.exit(0);
    }


    const headers = generateHeaders('current mock configuration');
    const header: string = options.showHeader ? headers.header : '';
    const footer: string = options.showFooter ? headers.footer : '';
    const file = typeof options.data !== 'undefined' ? '\n    * Config file: ' + options.data + '\n' : '\n';

    const report = `    * Enabled: ${environment?.mockConfig?.enabled}
    * Controller: ${environment.mockConfig.systemProduct}
    * Shelves: ${environment.mockConfig.enclosureOptions.expansionModels}
    * Slot Assignment: ${environment.mockConfig.enclosureOptions.dispersal}
 `;

    const output = header + file + report + footer;

    console.log(output)

    return output;

}

function setMockEnabled(value: boolean): void {
  environment.mockConfig.enabled = value;
  saveEnvironment();
}

function setMockModel(value: string): void {
  environment.mockConfig.systemProduct = models.controllers[value.toUpperCase()].systemProduct;
  environment.mockConfig.enclosureOptions.controllerModel = models.controllers[value.toUpperCase()].model;
  saveEnvironment();
}

function showAvailableModels(options: ReportOptions, key: string): void {
  const modelKeys = Object.keys(models[key]);
  let report = '\n';

  modelKeys.forEach((model: string) => {
    report += `    * ${model} \n`
  })

  const headers: Headers = generateHeaders('available mock ' + key);

  const header: string = options.showHeader ? headers.header : '';
  const footer: string = options.showFooter ? headers.footer : '';

  const output = header + report + footer;

  console.log(output)
}

function setMockDispersal(value: string): void {
  if (value.toLowerCase() === 'existing') {
    environment.mockConfig.enclosureOptions.dispersal = EnclosureDispersalStrategy.Existing;
  } else {
    environment.mockConfig.enclosureOptions.dispersal = EnclosureDispersalStrategy.Default;
  }
  saveEnvironment();
}

function setMockShelves(value: string): void {
  environment.mockConfig.enclosureOptions.expansionModels = value.length ? value.toUpperCase().split(',') : [];
  saveEnvironment();
}

function mock(command: Command, options: CommandOptions): void {
  if (command.shelves?.length === 0) setMockShelves(command.shelves);
  if (!Object.keys(options).length) {
    // showHelp(command);
  }

  if (command.reset) {
    environment.mockConfig = environmentTemplate.mockConfig;
    saveEnvironment();
  } else if (command.config) {
    console.log('Locating mock configuration file...');
    const path = 'src/assets/mock/configs/';
    const configStr = fs.readFileSync( path + command.config, 'utf8');
    const config = JSON.parse(configStr);

    environment.mockConfig = config;
    console.log('Mock config file found √\n');

    environment.mockConfig = command.config ? config : null;
    saveEnvironment();
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
        case 'config':
        case 'list':
          break;
        case 'enable':
          setMockEnabled(true);
          break;
        case 'disable':
          setMockEnabled(false);
          break;
        case 'model':
          setMockModel(command[option]);
          break;
        case 'assign':
          setMockDispersal(command[option]);
          break;
        case 'shelves':
          setMockShelves(command[option]);
          break;
        case 'showcontrollers':
          showAvailableModels({
            showHeader: true,
            showFooter: true,
          }, 'controllers');
          process.exit(0);
          break;
        case 'showshelves':
          showAvailableModels({
            showHeader: true,
            showFooter: true,
          }, 'shelves');
          process.exit(0);
          break;
        default: {
          console.log(command[option]);
          break;
        }
      }
    }
  }

  mockConfigReport({
    showHeader : true,
    showFooter: true,
  });
}

/*
* Mock Command
* */
function mockConfigWizard(): void {
  const controllerChoices = Object.keys(models.controllers);
  const shelfChoices = Object.keys(models.shelves);
  const dispersalChoices = ['Default', 'Existing'];
  const loadAfterSaveChoices = ['Yes', 'No'];
  const saveChoices = ['Save', 'Cancel'];

  inquirer.prompt([
    // Pass your questions in here
    {
      name: 'fileName',
      message: 'Give your config file a name:',
      type: 'input',
    },
    {
      name: 'controller',
      message: 'Choose a controller:',
      type: 'list',
      choices: controllerChoices,
      default: 'M40',
    },
    {
      name: 'shelves',
      message: 'Specify shelves (' + shelfChoices.toString() + '):',
      type: 'input',
      default: '',
    },
    {
      name: 'dispersal',
      message: 'Choose a slot assignment method (Default or Existing)',
      type: 'list',
      choices: dispersalChoices,
      default: 'Default',
    },
    {
      name: 'loadAfterSave',
      message: 'Should we load the config after saving?',
      type: 'list',
      choices: loadAfterSaveChoices,
      default: 'Yes',
    },
    {
      name: 'saveOrCancel',
      message: 'Are you ready to save this configuration?',
      type: 'list',
      choices: saveChoices,
      default: 'save',
    },
  ])
    .then((answers: ConfigWizardAnswers) => {
      const saveLocation = './src/assets/mock/configs';
      const extension = '.config.json';
      const filePath = saveLocation + '/' + answers.fileName + extension;

      console.info(`
        Saving configuration into ${filePath} with the following values.

        * Enabled: true
        * Controller: ${answers.controller}
        * Shelves: ${answers.shelves.length ? answers.shelves.toUpperCase() : 'None'}
        * Slot Assignment: ${answers.dispersal.toLowerCase()}
      `);

      const expansionModels: string[] = answers.shelves.length
        ? [].concat(answers.shelves.toUpperCase().split(','))
        : [];

      const enclosureOptions = {
        controllerModel: answers.controller.toUpperCase(),
        expansionModels: expansionModels,
        dispersal: dispersalAsEnum(answers.dispersal),
      }

      let mockConfig: MockEnclosureConfig = {
        enabled: true,
        enclosureOptions: enclosureOptions,
        systemProduct: models.controllers[answers.controller].systemProduct as string
      }

      if (answers.saveOrCancel === 'Save'){
        fs.writeFileSync(filePath, JSON.stringify(mockConfig), 'utf8');
      }

      if (answers.loadAfterSave === 'Yes') {
        environment.mockConfig = mockConfig;
        saveEnvironment();
      }
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.log(error);
      } else {
        // Something else went wrong
        console.log(error);
      }
    });
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

function showRemote(options: ReportOptions): void {
  const headers = generateHeaders('remote server');
  const header: string = options.showHeader ? headers.header : '';
  const footer: string = options.showFooter ? headers.footer : '';

  const report = `
    * Server URL: ${environment.remote}
 `;

  const output = header + report + footer;
  console.log(output);
}

function remote(command: Command, ip: string): void {
  console.log('Setting remote machine url...');

  const proxyConfigJson = './proxy.config.json';
  const url = normalizeUrl(ip);

  printCurrentConfig(proxyConfigJson);

  if (!url) {
    showRemote({
      showHeader: true,
      showFooter: true,
    });
    process.exit(0);
  }

  saveProxyConfig(proxyConfigJson, url);
  environment.remote = url;
  showRemote({
    showHeader: true,
    showFooter: true,
  });
  saveEnvironment();
}
