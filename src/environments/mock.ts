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

const originalEnvironment = {...environment};
const program: Command = new Command();
program
  .version('1.0.0')
  .description('Mocking enclosure ui support')
  .option('-d, --debug', 'debug output')
  .option('-c, --config <path>', 'load mock config file')
  .option('-r, --reset', 'Reset mock configuration option')
  .parse(process.argv);

const options = program.opts();
const environmentTs = './src/environments/environment.ts';
const defaultConfig = '$MOCKCONFIG$';

if (!options.reset && !options.config) {
  program.help();
} else if (program.reset) {
  setConfig(defaultConfig);
} else {
  for (let option in options) {
    if (program.debug) {
      console.log({
        option: option,
        value: program[option],
      })
    }

    switch (option) {
      case 'debug':
      case 'reset':
        break;
      case 'version':
        console.log(program.version);
        break;
      case 'config': {
        if (!program.reset) {
          setConfig(program.config);
        }
        break;
      }
    }
  }
}

function setConfig(file: string = defaultConfig): void {
  const prefix = 'export const environment = ';
  environment.mockConfig = file;
  const result = makePrintable(environment, prefix);
  if (program.debug) verboseOutput(result);
  fs.writeFileSync(environmentTs, result, 'utf8');
}

function verboseOutput(newConfig: string): void {
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
