import { adviseToSetRemote } from './advise-to-set-remote';
import {
  getConfigTemplate,
  getCurrentConfigAsString,
  updateEnvironment,
} from './save-environment';

function parseEnvironmentVersion(contents: string): string {
  const match = contents.match(/environmentVersion:\s*'([\d.]+)'/);
  return match ? match[1] : '';
}

export async function checkEnvironment(): Promise<void> {
  const currentConfig = getCurrentConfigAsString().trim();
  if (!currentConfig) {
    console.info('No current config set. Creating default config...');
    await updateEnvironment({});
    adviseToSetRemote();

    process.exit(0);
  }

  const currentVersion = parseEnvironmentVersion(currentConfig);
  if (!currentVersion) {
    console.error('Could not find environmentVersion in environment.ts');
    process.exit(1);
  }

  const template = getConfigTemplate();
  const supportedVersion = parseEnvironmentVersion(template);

  if (currentVersion !== supportedVersion) {
    console.error(`
  Environment version mismatch. Current: ${currentVersion}, Supported: ${supportedVersion}.
  Either update environment file manually or use "yarn ui reset" to reset to defaults.`);
    process.exit(1);
  }

  const hasRemotePlaceholder = currentConfig.includes('_REMOTE_');
  if (hasRemotePlaceholder) {
    adviseToSetRemote();
  }
}
