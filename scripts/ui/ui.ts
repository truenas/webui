import {environment} from '../../src/environments/environment';
import {environmentTemplate} from './environment.template';
import {Command} from 'commander';
import fs from 'fs';
import {EnclosureDispersalStrategy, MockStorageScenario} from "../../src/app/core/testing/enums/mock-storage.enum";
import {WebUiEnvironment} from "../../src/environments/environment.interface";
import inquirer from 'inquirer';
import {MockEnclosureConfig} from "../../src/app/core/testing/interfaces/mock-enclosure-utils.interface";
import * as figlet from 'figlet';
import {TopologyItemType} from "../../src/app/enums/v-dev-type.enum";

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

interface ConfigGeneratorAnswers {
  fileName: string;
  controller: string;
  shelves: string;
  dispersal: string;
  loadAfterSave: string;
  saveOrCancel: string;
}

interface ConfigLoaderAnswers {
  location: string;
  customFile?: string;
  includedFile?: string;
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
const mockConfigDir = './src/assets/mock/configs/';

/*
* Command Setup* */
const program: Command = new Command()
  .name('ui')
  .version('0.0.1')
  .description('TrueNAS webui setup utility')
  .usage('(Call from root directory of repo via yarn)')
  .addHelpText('before', banner())

const mockExamples = `
The mock command sets mock related configurations through the use of json files.
The repo includes some files for common configurations developers might need for testing.
Developers can also create custom config files. See examples below...

EXAMPLES:

  * Load a custom or included configuration file (guided)

  % ui mock | ui m

  * Generating a custom config file (guided)

  The --generate option will provide a series of prompts that results in the creation of a config.json file.
  After finishing the guided install, it will create the file with the provided selections in src/assets/mock/configs

    % ui mock --generate OR ui m -g
`

program
  .command('mock')
  .alias('m')
  .description('Configure mock settings via config.json files')
  .addHelpText('after', mockExamples)
  .option('-e, --enable', 'enable mock config')
  .option('-d, --disable', 'disable mock config')
  .option('-g, --generate', 'generate a mock config file')
  .action(() => {
    const mockCommand = program.commands.find((command: Command) => command.name() === 'mock');
    const mockOptions = commandOpts(mockCommand);
    mockConfig(mockCommand, mockOptions);

  });

const mockOptExamples = `
EXAMPLES:

  * Retrieve a list of mockable controller models

    % ui mock-opt -M OR ui mock-opt --showcontrollers

  * Retrieve a list of mockable expansion shelf models

    % ui mock-opt -S OR ui mock-opt --showshelves

  * Set the controller model to mock

    % ui mock-opt -m OR ui mock-opt --model

  * Set the expansion shelf models to mock

    NOTE: It will except no argument or empty string to specify no shelves.
    Specifying shelves must be done via a comma separated string

    % ui mock-opt -s 'es24,es24' OR ui mock-opt --shelves 'es24,es24'

  * Enable mock functionality

    % ui mock-opt -e OR ui mock-opt --enable

  * Disable mock functionality

    % ui mock-opt -d OR ui mock-opt --disable

  * Complete configuration example that creates an M50 with two ES24 shelves

    % ui mock-opt -e -m m50 -s 'es24,es24' -a default

`

program
  .command('mock-opt')
  .name('mock-opt')
  .alias('mo')
  .description('Set specific mock enclosure options')
  .addHelpText('after', mockOptExamples)
  .option('-e, --enable', 'enable mock config')
  .option('-d, --disable', 'disable mock config')
  .option('-M, --showcontrollers ', 'show available controllers for mock')
  .option('-S, --showshelves ', 'show available shelves for mock')
  .option('-m, --model <name>', 'set controller to mock')
  .option('-s, --shelves, [Array|null]', 'set expansion shelves to mock')
  .option('-a, --assign, <existing | default>', 'set slot assignment strategy')
  .option('-r, --reset', 'Reset mock configuration to default values')
  .option('-l, --list', 'show current mock config settings')
  .option('-D, --debug', 'debug output')
  .action(() => {
    const mockCommand = program.commands.find((command: Command) => command.name() === 'mock-opt');
    const mockOptions = commandOpts(mockCommand);
    mock(mockCommand, mockOptions);
  });

/*
TODO: Mock Disks Command
-e, --enabled => sets diskConfig.enabled
-d, --disabled => sets diskConfig.enabled
-s, --size => sets topologyOptions.diskSize
-r, --repeats => sets topologyOptions.repeat

**** Experimental Pool Mocking (Maybe hide for now) ****
-p, --pool: mockPools => sets mockPools to true
-u, --unassigned => sets mockPools to false
-l, --layout => sets topologyOptions.layout
-w, --width => sets topologyOptions.width
-S, --scenario => sets topologyOptions.scenario
 */

const mockDiskExamples = ``

program
  .command('mock-disks')
  .name('mock-disks')
  .alias('md')
  .description('Ignore all middleware disk related responses and create our own')
  .addHelpText('after', mockDiskExamples)
  .option('-e, --enable', 'enable mock disks')
  .option('-d, --disable', 'disable mock disks')
  .option('-s, --size, <number>', 'set disk size')
  .option('-r, --repeats, <number>', 'set number of disks')
  .option('-p, --pool', 'override pool data (experimental)')
  .option('-u, --unassigned', 'replace pool data with unassigned disks (experimental)')
  .option('-l, --layout, <layout>', 'vdev layout for mock pool (experimental)')
  .option('-w, --width, <number>', 'vdev width for mock pool (experimental)')
  .option('-S, --scenario, <number>', 'choose test scenario for mock pool (experimental)')
  .action(() => {
    const mockCommand = program.commands.find((command: Command) => command.name() === 'mock-disks');
    const mockOptions = commandOpts(mockCommand);
    mockDisks(mockCommand, mockOptions);
  });

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
  const imports = `import { EnclosureDispersalStrategy, MockStorageScenario } from "../app/core/testing/enums/mock-storage.enum";
import { WebUiEnvironment } from "./environment.interface";
import {TopologyItemType} from "../app/enums/v-dev-type.enum";\n
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
  if (Object.values(MockStorageScenario).includes(value as MockStorageScenario)) {
    console.log(value)
  }
  const trimmed = value.replace(/\"|\: /g, '');
  let output: string;

  for (const key in EnclosureDispersalStrategy) {
    if (key.toLowerCase() === trimmed) {
      output =  ': EnclosureDispersalStrategy.' + key;
    }
  }

  for (const key in MockStorageScenario) {
    if (key !== 'Default' && key.toLowerCase() === trimmed) {
      output =  ': MockStorageScenario.' + key;
    }
  }

  for (const key in TopologyItemType) {
    if (key !== 'Default' && key.toUpperCase() === trimmed) {
      output =  ': TopologyItemType.' + key;
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
* Mock Options Command
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
    const diskOptions = environment.mockConfig.diskOptions;

    let report = `    * Enabled: ${environment?.mockConfig?.enabled}
    * Controller: ${environment.mockConfig.systemProduct}
    * Shelves: ${environment.mockConfig.enclosureOptions.expansionModels}
    * Slot Assignment: ${environment.mockConfig.enclosureOptions.dispersal}
    * Mock Disks: ${diskOptions.enabled ? 'Enabled' : 'Disabled'}
 `;
  if (diskOptions.enabled) report += `   * Disk Size: ${diskOptions.topologyOptions.diskSize} TB`
  if (diskOptions.enabled) report += `\n    * Repeats: ${diskOptions.topologyOptions.repeats}`

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

function loadMockConfigFile(path: string): void {
  console.info('Locating mock configuration file...');
  const configStr = fs.readFileSync( path, 'utf8');
  let config = JSON.parse(configStr);
  if (!config.diskOptions) config.diskOptions = environment.mockConfig.diskOptions;

  environment.mockConfig = config;
  console.info('Mock config file found √\n');

  environment.mockConfig = path ? config : originalEnvironment.mockConfig;
  saveEnvironment();
}

function mock(command: Command, options: CommandOptions): void {
  if (options.shelves?.length === 0) setMockShelves(options.shelves);

  if (options.reset) {
    environment.mockConfig = environmentTemplate.mockConfig;
    saveEnvironment();
  } else if (options.config) {
    loadMockConfigFile(options.config);
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
* Mock Command
* */
function mockConfigGenerator(): void {
  const controllerChoices: string[] = Object.keys(models.controllers);
  const shelfChoices: string[] = Object.keys(models.shelves);
  const dispersalChoices: string[] = ['Default', 'Existing'];
  const loadAfterSaveChoices: string[] = ['Yes', 'No'];
  const saveChoices: string[] = ['Save', 'Cancel'];
  const saveLocation = mockConfigDir + 'custom/';

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
    .then((answers: ConfigGeneratorAnswers) => {
      const extension = '.config.json';
      const filePath = saveLocation + answers.fileName + extension;

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

function mockConfigLoader(): void {
  const includedDir = 'included/';
  const customDir = 'custom/';
  const locationChoices: string[] = ['included', 'custom'];
  const includedChoices: string[] = fs.readdirSync(mockConfigDir + includedDir).filter((fileName: string) => {
    return fileName.endsWith('config.json');
  });
  const customChoices: string[] = fs.readdirSync(mockConfigDir + customDir).filter((fileName: string) => {
    return fileName.endsWith('config.json');
  });

  inquirer.prompt([
    {
      name: 'location',
      message: 'Would you like to load an included or a custom config?',
      type: 'list',
      choices: locationChoices,
      default: 'included'
    },
    {
      name: 'customFile',
      message: 'Which custom config would you like to load?',
      type: 'list',
      choices: customChoices,
      when: ( answers ) => {
        return answers.location === 'custom';
      },
    },
    {
      name: 'includedFile',
      message: 'Which config would you like to load?',
      type: 'list',
      choices: includedChoices,
      when: ( answers ) => {
        return answers.location === 'included';
      },
    },
  ])
    .then((answers: ConfigLoaderAnswers) =>{
      const subDir = answers.location === 'custom'
        ? customDir + answers.customFile
        : includedDir + answers.includedFile

      loadMockConfigFile(mockConfigDir + subDir);

      mockConfigReport({
        showHeader : true,
        showFooter: true,
      });
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

function mockConfig(command: Command, options: CommandOptions): void {
  if (Object.keys(options).length === 0) {
    mockConfigLoader();
  }

  for (let option in options) {
    if (options.debug) {
      console.info({
        option: option,
        value: options[option],
      })
    }

    switch (option) {
      case 'config':
        loadMockConfigFile(options.config);
        break;
      case 'enable':
        setMockEnabled(true);
        mockConfigReport({
          showHeader : true,
          showFooter: true,
        });
        break;
      case 'disable':
        setMockEnabled(false);
        mockConfigReport({
          showHeader : true,
          showFooter: true,
        });
        break;
      case 'generate':
        mockConfigGenerator();
        break;
      default: {
        console.info(options[option]);
        break;
      }
    }
  }
}

/*
* Mock Disks Command
* */
function setDiskOptionsEnabled(value: boolean): void {
  environment.mockConfig.diskOptions.enabled = value;
  saveEnvironment();
}

function setDiskSize(value: number | string): void {
  const size: number = typeof value === 'string' ? Number(value) : value
  environment.mockConfig.diskOptions.topologyOptions.diskSize = size;
  saveEnvironment();
}

function setRepeats(value: number | string): void {
  const repeats: number = typeof value === 'string' ? Number(value) : value;
  environment.mockConfig.diskOptions.topologyOptions.repeats = repeats;
  saveEnvironment();
}

function mockDisks(command: Command, options: CommandOptions): void {
  for (let option in options) {
    switch (option) {
      case 'enable':
        setDiskOptionsEnabled(true);
        break;
      case 'disable':
        setDiskOptionsEnabled(false);
        break;
      case 'size':
        setDiskSize(options[option]);
        break;
      case 'repeats':
        setRepeats(options[option]);
        break;
      default:
        const warning = `WARNING: you're using experimental flags.\nThe flag "${option}" has not been implemented yet`
        console.info(warning);
        process.exit(0);
    }
  }

  mockConfigReport({
    showHeader : true,
    showFooter: true,
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

  console.info('Old remote value: ' + originalEnvironment.remote);
  saveProxyConfig(proxyConfigJson, url);
  environment.remote = url;
  showRemote({
    showHeader: true,
    showFooter: true,
  });
  saveEnvironment();
}
