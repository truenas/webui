/* eslint-disable */
import { environmentTemplate } from './environment.template';
import * as fs from 'fs';
import { exec } from 'child_process';
import {Command} from "commander";


/*
* Variables
* */
const environmentTs = './src/environments/environment.ts';
const template = './src/environments/environment.template.ts';

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


function checkEnv(suppress: boolean = false): void {
  exec('wc -w < ' + environmentTs, (error, stdout) => {
    const response = Number(stdout.replace(/\D/g, ''));
    const checkRemote = (suppress: boolean, envStr: string = '$SERVER$') => {
      if (envStr.includes('$SERVER$')) {
        console.log('Remote not set! Use yarn ui script to set remote url: yarn ui remote -i <ip-address>');
        process.exit(1);
      }
    }

    if (response > 0) {
      let envStr: string = fs.readFileSync(environmentTs, 'utf8');
      checkRemote(suppress, envStr);
      process.exit(0);
    } else {
      let templateStr: string = fs.readFileSync(template, 'utf8');
      fs.writeFileSync(
        environmentTs,
        templateStr.replace('environmentTemplate', 'environment'),
        'utf8'
      );

      checkRemote(suppress);
    }
  })
}



