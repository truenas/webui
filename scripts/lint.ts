#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, statSync, readdirSync } from 'fs';
import { resolve, relative, join, extname } from 'path';

// Parse command line arguments
const args: string[] = process.argv.slice(2);
const isFixMode: boolean = args.includes('--fix');
const fileArgs: string[] = args.filter((arg) => arg !== '--fix' && !arg.startsWith('--'));

// Recursively get all files in a directory with specific extensions
function getFilesRecursively(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentPath: string): void {
    try {
      const entries = readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and other common directories to ignore
          if (!['node_modules', '.git', 'dist', 'coverage', '.angular'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      console.warn(`Warning: Unable to read directory: ${currentPath}`);
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
      if (['.ts', '.tsx', '.js', '.jsx', '.scss'].includes(ext)) {
        return [relativePath];
      }
      console.warn(`Warning: File ${filePath} is not a TypeScript or SCSS file`);
      return [];
    }
    if (stats.isDirectory()) {
      // Get all TypeScript and SCSS files in the directory
      const allFiles = getFilesRecursively(absolutePath, ['.ts', '.tsx', '.js', '.jsx', '.scss']);
      return allFiles.map((file) => relative(projectRoot, file));
    }
    console.warn(`Warning: Path is neither a file nor a directory: ${filePath}`);
    return [];
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`Warning: Error processing path ${filePath}:`, errorMessage);
    return [];
  }
}

// Process all file arguments
const validFiles: string[] = fileArgs.flatMap(processPath);

// Separate TypeScript/JavaScript files from SCSS files
const tsJsFiles = validFiles.filter((file) => file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'));
const scssFiles = validFiles.filter((file) => file.endsWith('.scss'));

// Determine what files to lint
const hasFileArgs: boolean = validFiles.length > 0;
const eslintArgs: string[] = ['eslint'];
const stylelintArgs: string[] = ['stylelint'];

if (hasFileArgs && tsJsFiles.length > 0) {
  eslintArgs.push(...tsJsFiles);
} else if (!hasFileArgs) {
  eslintArgs.push('.');
}

if (isFixMode) {
  eslintArgs.push('--fix');
  stylelintArgs.push('--fix');
}

// For stylelint, only run if we have SCSS files or no specific files were provided
const shouldRunEslint: boolean = !hasFileArgs || tsJsFiles.length > 0;
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
    // Run ESLint if needed
    if (shouldRunEslint) {
      const eslintTargetDesc = hasFileArgs
        ? `${tsJsFiles.length} TypeScript/JavaScript file(s)`
        : 'all TypeScript/JavaScript files';
      console.info(`Running ESLint on: ${eslintTargetDesc}`);
      await runCommand('npx', eslintArgs, { TIMING: '30' });
    }

    // Run Stylelint if needed
    if (shouldRunStylelint) {
      const stylelintTargetDesc = hasFileArgs && scssFiles.length > 0
        ? `${scssFiles.length} SCSS file(s)`
        : 'all SCSS files';
      console.info(`Running Stylelint on: ${stylelintTargetDesc}`);
      await runCommand('npx', stylelintArgs);
    }

    // Handle case where no files were found
    if (hasFileArgs && !shouldRunEslint && !shouldRunStylelint) {
      console.warn('⚠️  No TypeScript or SCSS files found to lint');
    } else {
      console.info('✅ Linting completed successfully');
    }
  } catch (error) {
    console.error('❌ Linting failed:', error.message);
    process.exit(1);
  }
}

main();
