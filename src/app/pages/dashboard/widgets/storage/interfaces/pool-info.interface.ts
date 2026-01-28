import { tnIconMarker } from '@truenas/ui-components';
import { PoolTopology } from 'app/interfaces/pool.interface';

export interface ItemInfo {
  icon: string;
  level: StatusLevel;
  label: string;
  value: string;
}

export enum StatusLevel {
  Safe = 'safe',
  Warn = 'warn',
  Error = 'error',
  Neutral = 'neutral',
}

export const statusIcons = {
  error: tnIconMarker('error', 'material'),
  checkCircle: tnIconMarker('check_circle', 'material'),
  mdiAlert: tnIconMarker('alert', 'mdi'),
  mdiCloseCircle: tnIconMarker('close-circle', 'mdi'),
  arrowCircleRight: tnIconMarker('arrow_circle_right', 'material'),
  neutral: tnIconMarker('minus-circle', 'mdi'),
};

export interface PoolInfo {
  name: string;
  topology: PoolTopology;
  status: ItemInfo;
  usedSpace: ItemInfo;
  disksWithError: ItemInfo;
  scan: ItemInfo;
  freeSpace: string;
  totalDisks: string;
}
