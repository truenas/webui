import { environmentTemplate } from './environment.template';
import * as fs from 'fs';
import {Command} from "commander";
import {environmentVersion} from "../../src/environments/environment.version";

/*
* Variables
* */
const environmentTs = './src/environments/environment.ts';
const template = './scripts/ui/environment.template.ts';

const program: Command = new Command();
program
  .version('0.0.1')
  .description('Checks for environment file and creates one if not present')
  .option('-s, --suppress', 'Exit without error if remote not set')
  .option('-q, --quiet', 'Don\'t show output')
  .action(() => {
    const options = program.opts();
    const suppress = typeof options.suppress === 'undefined' ? false : options.suppress;
    const quiet = typeof options.quiet === 'undefined' ? false : options.quiet;

    checkEnv(suppress, quiet);
  })

program.parse(process.argv);


export function checkEnv(suppress: boolean = false, quiet: boolean = false): boolean {
  let remoteIsSet: boolean = false;
  const fileExists = fs.existsSync(environmentTs);
  let envStr: string = '';
  let wordCount: number = 0;
  let isCurrent: boolean = false;

  if (fileExists) {
    // Make sure it's not just an empty file either
    envStr = fs.readFileSync(environmentTs, 'utf8');
    const regex = /\S+/g;
    const match = envStr.match(regex);
    wordCount = match !== null ? match.length : 0;

    // Make sure environment file is the currently supported version
    isCurrent = getVersion(envStr) === environmentVersion;
  }

  const isRemoteSet = (suppress: boolean, quiet: boolean, envStr: string = '$SERVER$'): boolean => {
    if (envStr.includes('$SERVER$') && !quiet) {
      const message = `
Ready for development but remote not set.
Use yarn ui script to set remote url: yarn ui remote -i <ip-address>
`
      if (!suppress) {
        console.info(message);
      }

      return false
    }
    return true;
  }

  if (fileExists && wordCount > 0 && isCurrent) {
    if (!quiet) console.info('Environment file exists');
    remoteIsSet = isRemoteSet(suppress, quiet, envStr);
  } else {
    if (!quiet) console.info('Environment file not found. Creating new file with default values');
    let templateStr: string = fs.readFileSync(template, 'utf8');
    fs.writeFileSync(
      environmentTs,
      templateStr.replace('environmentTemplate', 'environment'),
      'utf8'
    );

    remoteIsSet = isRemoteSet(suppress, quiet);
  }

  return remoteIsSet;

}

function getVersion(envStr: string): string {
  const property = /environmentVersion:.*/g;
  const misc = /\{|\}|\'|\"|\`|\;|\,|\s/g;
  const match = envStr.match(property)
  const value = match === null ? 'undefined' : match[0].split(':')[1].replace(misc, '');
  console.info('Environment version: ' + value);
  return value;
}



