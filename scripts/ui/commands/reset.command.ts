/* eslint-disable no-restricted-imports */
import { adviseToSetRemote } from '../utils/advise-to-set-remote';
import { updateEnvironment } from '../utils/save-environment.utils';

export function resetCommand(): void {
  updateEnvironment({});
  console.info('Reset to default config');
  adviseToSetRemote();
}
