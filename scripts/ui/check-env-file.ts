import { getConfigTemplate, getCurrentConfigAsString, updateEnvironment } from './utils/save-environment.utils';

function adviseToSetRemote(): void {
  console.info('No remote server set. Please set a remote server using the command: yarn ui remote -i <ip_address>');
}

function parseEnvironmentVersion(contents: string): string {
  const match = contents.match(/environmentVersion:\s*'([\d.]+)'/);
  return match ? match[1] : '';
}

function validateConfig(): void {
  const currentConfig = getCurrentConfigAsString();
  if (!currentConfig) {
    console.info('No current config set. Creating default config...');
    updateEnvironment({});
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
  Either update environment file manually or remove it to generate a new one.`);
    process.exit(1);
  }

  const hasRemotePlaceholder = currentConfig.includes('_REMOTE_');
  if (hasRemotePlaceholder) {
    adviseToSetRemote();
  }
}

validateConfig();
