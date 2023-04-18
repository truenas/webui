/* eslint-disable */
import { environmentTemplate } from './environment.template';
import * as fs from 'fs';
import { exec } from 'child_process';
import {Command} from "commander";


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
  .action(() => {
    const options = program.opts();
    const suppress = typeof options.suppress === 'undefined' ? false : options.suppress;
    checkEnv(suppress);
  })

program.parse(process.argv);


export function checkEnv(suppress: boolean = false): boolean {
  let remoteIsSet: boolean = false;
  const fileExists = fs.existsSync(environmentTs);
  let envStr: string = '';
  let wordCount: number = 0;

  if (fileExists) {
    // Make sure it's not just an empty file either
    envStr = fs.readFileSync(environmentTs, 'utf8');
    const regex = /\S+/g;
    const match = envStr.match(regex);
    wordCount = match !== null ? match.length : 0;
  }

  const isRemoteSet = (suppress: boolean, envStr: string = '$SERVER$'): boolean => {
    if (envStr.includes('$SERVER$')) {
      const message = `
Ready for development but remote not set.
Use yarn ui script to set remote url: ./ui remote -i <ip-address>
`
      if (!suppress) {
        console.log(message);
      }

      return false
    }
    return true;
  }

  if (fileExists && wordCount > 0) {
    console.log('Environment file exists');
    remoteIsSet = isRemoteSet(suppress, envStr);
  } else {
    console.log('Environment file not found. Creating new file with default values');
    let templateStr: string = fs.readFileSync(template, 'utf8');
    fs.writeFileSync(
      environmentTs,
      templateStr.replace('environmentTemplate', 'environment'),
      'utf8'
    );

    remoteIsSet = isRemoteSet(suppress);
  }

  return remoteIsSet;

}



