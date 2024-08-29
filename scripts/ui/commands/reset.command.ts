/* eslint-disable no-restricted-imports */
import { adviseToSetRemote } from '../utils/advise-to-set-remote';
import { updateEnvironment, writeToEnvironment } from '../utils/save-environment';

export async function resetCommand(): Promise<void> {
  writeToEnvironment('');
  await updateEnvironment({});
  console.info('Reset to default config');
  adviseToSetRemote();
}
