import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum DockerNvidiaStatus {
  Absent = 'ABSENT',
  Installed = 'INSTALLED',
  Installing = 'INSTALLING',
  InstallError = 'INSTALL_ERROR',
  NotInstalled = 'NOT_INSTALLED',
}

export const dockerNvidiaStatusLabels = new Map<DockerNvidiaStatus, string>([
  [DockerNvidiaStatus.Absent, T('Absent')],
  [DockerNvidiaStatus.Installed, T('Installed')],
  [DockerNvidiaStatus.Installing, T('Installing')],
  [DockerNvidiaStatus.InstallError, T('Error Installing')],
  [DockerNvidiaStatus.NotInstalled, T('Not Installed')],
]);

export interface DockerNvidiaStatusResponse {
  status: DockerNvidiaStatus;
}
