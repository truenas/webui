#!/usr/bin/env node

/**
 * Updates the service worker cache version with the current build timestamp and git commit.
 * This ensures users get the latest version after deployment.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Paths
const swPath = path.join(dirname, '..', 'dist', 'sw.js');
const swSourcePath = path.join(dirname, '..', 'src', 'sw.js');

function updateServiceWorkerVersion(): void {
  // Get current git commit hash (first 8 characters)
  let gitHash = 'unknown';
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('Could not get git commit hash:', (error as Error).message);
  }

  // Generate version string with timestamp and git hash
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const version = `${timestamp}-${gitHash}`;

  // Read the service worker file
  const sourceFilePath = fs.existsSync(swPath) ? swPath : swSourcePath;
  let swContent: string;
  try {
    swContent = fs.readFileSync(sourceFilePath, 'utf-8');
  } catch (error) {
    console.error('❌ Failed to read Service Worker file:', error);
    throw error; // Let the build process handle the failure
  }

  // Replace the placeholder with actual version
  swContent = swContent.replace('BUILD_VERSION_PLACEHOLDER', version);

  // Write back to dist folder
  const targetPath = swPath;
  try {
    fs.writeFileSync(targetPath, swContent, 'utf-8');
  } catch (error) {
    console.error('❌ Failed to write Service Worker file:', error);
    throw error; // Let the build process handle the failure
  }

  console.info(`✅ Service Worker version updated to: ${version}`);
  console.info(`   File: ${targetPath}`);
}

// Run the function and handle errors
try {
  updateServiceWorkerVersion();
} catch (error) {
  console.error('Build script failed:', error);
  process.exit(1);
}

export { updateServiceWorkerVersion };
