import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum TransferMode {
  Sync = 'SYNC',
  Copy = 'COPY',
  Move = 'MOVE',
}

export const transferModeNames = new Map<TransferMode, string>([
  [TransferMode.Sync, T('SYNC')],
  [TransferMode.Copy, T('COPY')],
  [TransferMode.Move, T('MOVE')],
]);
