import fs from 'fs';
// eslint-disable-next-line no-restricted-imports
import { getCurrentConfig, updateEnvironment } from '../utils/save-environment';

function normalizeUrl(url = ''): string {
  const parts = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?([^:/\n?]+)(?::([0-9]+))?/);

  if (!parts?.length) {
    return '';
  }

  let normalizedUrl = parts[1];
  if (parts[2]) {
    normalizedUrl = normalizedUrl + ':' + parts[2];
  }

  return normalizedUrl;
}

function saveProxyConfig(file: string, url: string): void {
  const data = fs.readFileSync(file + '.template', 'utf8');
  const result = data.replace(/_REMOTE_/g, url);
  fs.writeFileSync(file, result, 'utf8');
}

async function printCurrentRemote(): Promise<void> {
  const environment = await getCurrentConfig();
  const remote = environment.remote === '_REMOTE_' ? 'Not set' : environment.remote;
  const report = `Server URL: ${remote}`;
  console.info(report);
}

export async function remoteCommand(ip: string, force: boolean): Promise<void> {
  const proxyConfigJson = './proxy.config.json';
  const url = force ? ip : normalizeUrl(ip);

  await printCurrentRemote();

  if (!url) {
    process.exit(0);
  }

  saveProxyConfig(proxyConfigJson, url);
  await updateEnvironment({
    remote: url,
  });
  console.info(`New Server URL: ${url}`);
}
