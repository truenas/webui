#!/usr/bin/env node

import { spawn } from 'child_process';

// Parse command line arguments
const args: string[] = process.argv.slice(2);
const isFixMode: boolean = args.includes('--fix');
const fileArgs: string[] = args.filter((arg) => arg !== '--fix' && !arg.startsWith('--'));

// Determine what files to lint
const hasFileArgs: boolean = fileArgs.length > 0;
const eslintTarget: string = hasFileArgs ? fileArgs.join(' ') : '.';
const stylelintTarget: string = hasFileArgs ? fileArgs.filter((file) => file.endsWith('.scss')).join(' ') : 'src/**/*.scss';

// Build commands
const eslintArgs: string[] = ['eslint', eslintTarget];
if (isFixMode) {
  eslintArgs.push('--fix');
}

const stylelintArgs: string[] = ['stylelint'];
if (isFixMode) {
  stylelintArgs.push('--fix');
}

// Only run stylelint if we have SCSS files to lint
const shouldRunStylelint: boolean = !hasFileArgs || fileArgs.some((file) => file.endsWith('.scss'));

function runCommand(command: string, cmdArgs: string[], env: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, cmdArgs, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main(): Promise<void> {
  try {
    // Run ESLint
    console.info(`Running ESLint on: ${eslintTarget}`);
    await runCommand('npx', eslintArgs, { TIMING: '30' });

    // Run Stylelint if needed
    if (shouldRunStylelint && stylelintTarget) {
      console.info(`Running Stylelint on: ${stylelintTarget}`);
      await runCommand('npx', [...stylelintArgs, stylelintTarget]);
    }

    console.info('✅ Linting completed successfully');
  } catch (error) {
    console.error('❌ Linting failed:', error.message);
    process.exit(1);
  }
}

main();
