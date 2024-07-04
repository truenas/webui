import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum DirectoryServiceState {
  Disabled = 'DISABLED',
  Healthy = 'HEALTHY',
  Faulted = 'FAULTED',
  Leaving = 'LEAVING',
  Joining = 'JOINING',
}

export const directoryServiceStateLabels = new Map<DirectoryServiceState, string>([
  [DirectoryServiceState.Disabled, T('Disabled')],
  [DirectoryServiceState.Healthy, T('Healthy')],
  [DirectoryServiceState.Faulted, T('Faulted')],
  [DirectoryServiceState.Leaving, T('Leaving')],
  [DirectoryServiceState.Joining, T('Joining')],
]);
