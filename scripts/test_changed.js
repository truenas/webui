import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import path from "path";

/**
 * Runs tests in immediate directory of changed files staged for the commit.
 * It's less inclusive than `jest -o`, which tends to include too many files.
 *
 * Usage: yarn test:changed
 */
function getChangedDirectories() {
  const output = execSync('git status --porcelain').toString();
  const lines = output.split('\n');
  const directories = new Set();

  for (let line of lines) {
    if (line.match(/^ ?[AM].*/)) {
      const filePath = line.slice(3).trim();
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      if (dir) {
        directories.add(dir);
      }
    }
  }
  return [...directories];
}

function findTestFiles(directory) {
  const testFiles = [];
  const entries = readdirSync(directory, { withFileTypes: true });
  for (let entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isFile() && entry.name.match(/\.spec\.ts$/)) {
      testFiles.push(entryPath);
    }
  }
  return testFiles;
}

function runJestWithTestFiles(testFiles) {
  if (testFiles.length > 0) {
    try {
      console.log('Running tests for collected test files...');
      execSync(`jest ${testFiles.join(' ')}`, { stdio: 'inherit' });
      console.log('All tests passed. 😎');
    } catch (error) {
      console.error('Some tests failed. 😩');
    }
  } else {
    console.log('No tests to run.');
  }
}

const directories = getChangedDirectories();
const allTestFiles = [];

directories.forEach(dir => {
  allTestFiles.push(...findTestFiles(dir));
});

runJestWithTestFiles(allTestFiles);
