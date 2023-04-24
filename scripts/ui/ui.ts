import {environment} from '../../src/environments/environment';
import {environmentTemplate} from './environment.template';
import {Command} from 'commander';
import fs from 'fs';
import {EnclosureDispersalStrategy} from "../../src/app/core/testing/enums/mock-storage.enum";
import {WebUiEnvironment} from "../../src/environments/environment.interface";
import inquirer from 'inquirer';
import {MockEnclosureConfig} from "../../src/app/core/testing/interfaces/mock-enclosure-utils.interface";
import * as figlet from 'figlet';

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
* Command Setup* */
const program: Command = new Command()
  .name('./ui')
  .version('0.0.1')
  .description('TrueNAS webui setup utility')
  .usage('(Call from root directory)')
  .addHelpText('before', banner())

const mockExamples = `
EXAMPLES:

  * Retrieve a list of mockable controller models

    % ./ui mock -M OR ./ui mock --showcontrollers

  * Retrieve a list of mockable expansion shelf models

    % ./ui mock -S OR ./ui mock --showshelves

  * Set the controller model to mock

    % ./ui mock -m OR ./ui mock --model

  * Set the expansion shelf models to mock

    NOTE: It will except no argument or empty string to specify no shelves.
    Specifying shelves must be done via a comma separated string

    % ./ui mock -s 'es24,es24' OR ./ui mock --shelves 'es24,es24'

  * Enable mock functionality

    % ./ui mock -e OR ./ui mock --enable

  * Disable mock functionality

    % ./ui mock -d OR ./ui mock --disable

  * Complete configuration example that creates an M50 with two ES24 shelves

    % ./ui mock -e -m m50 -s 'es24,es24' -a default

  * Loading a config.json file

    This script will look for config.json files in src/assets/mock/configs.

    % ./ui mock -c <filename> OR ./ui mock --config <filename>

    NOTE: To see how to use this script to generate a config file, see the mock-gen command

`

program
  .command('mock')
  .name('mock')
  .description('Mocking enclosure ui support')
  .addHelpText('after', mockExamples)
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
    const mockCommand = program.commands.find((command: Command) => command.name() === 'mock');
    const mockOptions = commandOpts(mockCommand);
    mock(mockCommand, mockOptions);
  });

const mockGenExamples = `
EXAMPLES:

  * Generating a config.json

  The mock-gen command will provide a series of prompts that results in the creation of a config.json file
  After finishing the guided install, it will create the file with the provided selections in src/assets/mock/configs

    % ./ui mock-gen OR ./ui mg
`

program
  .command('mock-gen')
  .alias('mg')
  .description('Generates a mock config.json file')
  .addHelpText('after', mockGenExamples)
  .action(() => {
    mockConfigWizard();
  })

program
  .command('reset')
  .description('Reset environment file to initial state')
  .action(() => {
    reset();
    process.exit(0);
    console.info(environment);

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
    const remoteCommand = program.commands.find((command: Command) => command.name() === 'remote');
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

program.parse(process.argv);

// How is this not built into commander.js?
function commandOpts(command: Command): CommandOptions {
  const keys: string[] = command.options.map((option: any) => {
    const key = option.long.replace(/^--/ ,'');
    return key;
  });

  let options: CommandOptions = {};

  keys.forEach((key: string) => {
    if (command.getOptionValue(key)) {
      options[key] = command.getOptionValue(key);
    }
  });

  return options;
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
  const imports = `import { EnclosureDispersalStrategy } from "../app/core/testing/enums/mock-storage.enum";
import { WebUiEnvironment } from "./environment.interface";\n
`

  const prefix = 'export const environment: WebUiEnvironment = ';
  const result = makePrintable(environment, imports + prefix);

  fs.writeFileSync(environmentTs, result, 'utf8');
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
    case 'object': {
      if (key === 'mockConfig') {
        const regexBefore = /\".*\"\:/g;
        const regexAfter = /\: \".*\"/g;
        const pretty = JSON.stringify(value, null, "  ")
          .replace(regexBefore, (match) => {
            return match.replace(/\"/g, '');
          }).replace(regexAfter, (match) => {
            const converted = enumAsString(match);
            return converted;
          }).replace(/\"/g, '\'') // Double quotes to single quotes
          .replace(/\'true\'/g, 'true') // remove quotes from boolean true
          .replace(/\'false\'/g, 'false') // remove quotes from boolean false
          .replace(/\n/g, '\n  ') // fix indentation

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
      console.info('Something is wrong. Environment variable not initialized');
      console.info(environment);
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

    console.info(output);

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

  console.info(output)
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
  if (options.shelves?.length === 0) setMockShelves(options.shelves);
  if (!Object.keys(options).length) {
    // showHelp(command);
  }

  if (options.reset) {
    environment.mockConfig = environmentTemplate.mockConfig;
    saveEnvironment();
  } else if (options.config) {
    console.info('Locating mock configuration file...');
    const path = 'src/assets/mock/configs/';
    const configStr = fs.readFileSync( path + options.config, 'utf8');
    const config = JSON.parse(configStr);

    environment.mockConfig = config;
    console.info('Mock config file found √\n');

    environment.mockConfig = options.config ? config : null;
    saveEnvironment();
  } else {
    for (let option in options) {
      if (options.debug) {
        console.info({
          option: option,
          value: options[option],
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
          setMockModel(options[option]);
          break;
        case 'assign':
          setMockDispersal(options[option]);
          break;
        case 'shelves':
          setMockShelves(options[option]);
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
          console.info(options[option]);
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
* Mock Generate Command
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

      const expansionModels: string[] = answers.shelves.length
        ? [].concat(answers.shelves.toUpperCase().split(','))
        : [];

      const enclosureOptions = {
        controllerModel: models.controllers[answers.controller.toUpperCase()].model,
        expansionModels: expansionModels,
        dispersal: dispersalAsEnum(answers.dispersal),
      }

      let mockConfig: MockEnclosureConfig = {
        enabled: true,
        enclosureOptions: enclosureOptions,
        systemProduct: models.controllers[answers.controller].systemProduct as string
      }

      if (answers.saveOrCancel === 'Save'){
        console.info(`
        Saving configuration into ${filePath} with the following values.

        * Enabled: true
        * Controller: ${models.controllers[answers.controller].systemProduct as string}
        * Shelves: ${answers.shelves.length ? answers.shelves.toUpperCase() : 'None'}
        * Slot Assignment: ${answers.dispersal.toLowerCase()}
      `);

        const contents = JSON.stringify(mockConfig, null,'  ');
        fs.writeFileSync(filePath, contents, 'utf8');
      } else {
        console.info('Aborting mock file generation. No file will be generated and environment remains unchanged');
        process.exit(0);
      }

      if (answers.loadAfterSave === 'Yes') {
        environment.mockConfig = mockConfig;
        saveEnvironment();
        console.info('Config loaded into environment');
      } else {
        console.info('New configuration not to be loaded. Environment remains unchanged')
      }
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.info(error);
      } else {
        // Something else went wrong
        console.info(error);
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
    console.info('No current config set.');
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
  console.info(output);
}

function remote(command: Command, ip: string): void {
  console.info('Setting remote machine url...');

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
