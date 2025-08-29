#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, statSync, readdirSync } from 'fs';
import { resolve, relative, join, extname } from 'path';

// File extension constants for better maintainability
const typescriptExtensions = ['.ts', '.tsx'];
const javascriptExtensions = ['.js', '.jsx'];
const styleExtensions = ['.scss'];
const allSupportedExtensions = [...typescriptExtensions, ...javascriptExtensions, ...styleExtensions];
const ignoredDirectories = ['node_modules', '.git', 'dist', 'coverage', '.angular'];

// Parse command line arguments
const args: string[] = process.argv.slice(2);
const isFixMode: boolean = args.includes('--fix');
const pathArguments: string[] = args.filter((arg) => arg !== '--fix' && !arg.startsWith('--'));

// Recursively get all files in a directory with specific extensions
function getFilesRecursively(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentPath: string): void {
    try {
      const entries = readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Skip ignored directories
          if (!ignoredDirectories.includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Unable to read directory '${currentPath}': ${errorMessage}`);
    }
  }

  walk(dir);
  return files;
}

// Validate and process file/directory paths
function processPath(filePath: string): string[] {
  try {
    // Resolve to absolute path
    const absolutePath = resolve(filePath);

    // Check if path exists
    if (!existsSync(absolutePath)) {
      console.warn(`Warning: Path does not exist: ${filePath}`);
      return [];
    }

    // Ensure path is within project directory
    const projectRoot = resolve(process.cwd());
    const relativePath = relative(projectRoot, absolutePath);

    // Check if path is outside project (starts with .. or is absolute)
    if (relativePath.startsWith('..')) {
      console.warn(`Warning: Path is outside project directory: ${filePath}`);
      return [];
    }

    const stats = statSync(absolutePath);

    if (stats.isFile()) {
      // Return single file if it's a TypeScript or SCSS file
      const ext = extname(absolutePath).toLowerCase();
      if (allSupportedExtensions.includes(ext)) {
        return [relativePath];
      }
      console.warn(`Warning: File ${filePath} is not a TypeScript or SCSS file`);
      return [];
    }
    if (stats.isDirectory()) {
      // Get all supported files in the directory
      const allFiles = getFilesRecursively(absolutePath, allSupportedExtensions);
      return allFiles.map((file) => relative(projectRoot, file));
    }
    console.warn(`Warning: Path is neither a file nor a directory: ${filePath}`);
    return [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Error processing path '${filePath}': ${errorMessage}`);
    return [];
  }
}

// Process all path arguments
const discoveredFiles: string[] = pathArguments.flatMap(processPath);

// Single-pass partition to separate TypeScript/JavaScript files from SCSS files
interface FilePartition {
  scriptFiles: string[];
  styleFiles: string[];
}

function partitionFilesByType(files: string[]): FilePartition {
  const partition: FilePartition = { scriptFiles: [], styleFiles: [] };

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (typescriptExtensions.includes(ext) || javascriptExtensions.includes(ext)) {
      partition.scriptFiles.push(file);
    } else if (styleExtensions.includes(ext)) {
      partition.styleFiles.push(file);
    }
  }

  return partition;
}

const { scriptFiles, styleFiles } = partitionFilesByType(discoveredFiles);

// Determine what files to lint
const hasSpecificFilesToLint: boolean = discoveredFiles.length > 0;
const eslintArgs: string[] = ['eslint'];
const stylelintArgs: string[] = ['stylelint'];

if (hasSpecificFilesToLint && scriptFiles.length > 0) {
  eslintArgs.push(...scriptFiles);
} else if (!hasSpecificFilesToLint) {
  eslintArgs.push('.');
}

if (isFixMode) {
  eslintArgs.push('--fix');
  stylelintArgs.push('--fix');
}

// For stylelint, only run if we have SCSS files or no specific files were provided
const shouldRunEslint: boolean = !hasSpecificFilesToLint || scriptFiles.length > 0;
const shouldRunStylelint: boolean = !hasSpecificFilesToLint || styleFiles.length > 0;

if (hasSpecificFilesToLint && styleFiles.length > 0) {
  stylelintArgs.push(...styleFiles);
} else if (!hasSpecificFilesToLint) {
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
    // Run ESLint if needed
    if (shouldRunEslint) {
      const eslintTargetDescription = hasSpecificFilesToLint
        ? `${scriptFiles.length} TypeScript/JavaScript file(s)`
        : 'all TypeScript/JavaScript files';
      console.info(`Running ESLint on: ${eslintTargetDescription}`);
      await runCommand('npx', eslintArgs, { TIMING: '30' });
    }

    // Run Stylelint if needed
    if (shouldRunStylelint) {
      const stylelintTargetDescription = hasSpecificFilesToLint && styleFiles.length > 0
        ? `${styleFiles.length} SCSS file(s)`
        : 'all SCSS files';
      console.info(`Running Stylelint on: ${stylelintTargetDescription}`);
      await runCommand('npx', stylelintArgs);
    }

    // Handle case where no files were found
    if (hasSpecificFilesToLint && !shouldRunEslint && !shouldRunStylelint) {
      console.warn('⚠️  No TypeScript or SCSS files found to lint');
    } else {
      console.info('✅ Linting completed successfully');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Linting failed:', errorMessage);
    process.exit(1);
  }
}

main();
