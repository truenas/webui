#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve, relative } from 'path';

// Parse command line arguments
const args: string[] = process.argv.slice(2);
const isFixMode: boolean = args.includes('--fix');
const fileArgs: string[] = args.filter((arg) => arg !== '--fix' && !arg.startsWith('--'));

// Validate and sanitize file paths
function validateFilePath(filePath: string): string | null {
  try {
    // Resolve to absolute path
    const absolutePath = resolve(filePath);

    // Check if file exists
    if (!existsSync(absolutePath)) {
      console.warn(`Warning: File does not exist: ${filePath}`);
      return null;
    }

    // Check if it's a file (not directory)
    const stats = statSync(absolutePath);
    if (!stats.isFile()) {
      console.warn(`Warning: Path is not a file: ${filePath}`);
      return null;
    }

    // Ensure file is within project directory
    const projectRoot = resolve(process.cwd());
    const relativePath = relative(projectRoot, absolutePath);

    // Check if file is outside project (starts with .. or is absolute)
    if (relativePath.startsWith('..') || resolve(relativePath) !== absolutePath) {
      console.warn(`Warning: File is outside project directory: ${filePath}`);
      return null;
    }

    return relativePath;
  } catch {
    console.warn(`Warning: Invalid file path: ${filePath}`);
    return null;
  }
}

// Sanitize file arguments
const validFileArgs: string[] = fileArgs
  .map(validateFilePath)
  .filter((path): path is string => path !== null);

// Determine what files to lint
const hasFileArgs: boolean = validFileArgs.length > 0;
const eslintArgs: string[] = ['eslint'];
const stylelintArgs: string[] = ['stylelint'];

if (hasFileArgs) {
  eslintArgs.push(...validFileArgs);
} else {
  eslintArgs.push('.');
}

if (isFixMode) {
  eslintArgs.push('--fix');
  stylelintArgs.push('--fix');
}

// For stylelint, only include SCSS files
const scssFiles = hasFileArgs ? validFileArgs.filter((file) => file.endsWith('.scss')) : [];
const shouldRunStylelint: boolean = !hasFileArgs || scssFiles.length > 0;

if (hasFileArgs && scssFiles.length > 0) {
  stylelintArgs.push(...scssFiles);
} else if (!hasFileArgs) {
  stylelintArgs.push('src/**/*.scss');
}

function runCommand(command: string, cmdArgs: string[], env: Record<string, string> = {}): Promise<void> {
  return new Promise((promiseResolve, promiseReject) => {
    const child = spawn(command, cmdArgs, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });

    child.on('close', (code) => {
      if (code === 0) {
        promiseResolve();
      } else {
        promiseReject(new Error(`${command} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      promiseReject(error);
    });
  });
}

async function main(): Promise<void> {
  try {
    // Run ESLint
    const eslintTargetDesc = hasFileArgs ? validFileArgs.join(', ') : 'all files';
    console.info(`Running ESLint on: ${eslintTargetDesc}`);
    await runCommand('npx', eslintArgs, { TIMING: '30' });

    // Run Stylelint if needed
    if (shouldRunStylelint) {
      const stylelintTargetDesc = hasFileArgs && scssFiles.length > 0 ? scssFiles.join(', ') : 'all SCSS files';
      console.info(`Running Stylelint on: ${stylelintTargetDesc}`);
      await runCommand('npx', stylelintArgs);
    }

    console.info('✅ Linting completed successfully');
  } catch (error) {
    console.error('❌ Linting failed:', error.message);
    process.exit(1);
  }
}

main();
