import { PoolTopology } from 'app/interfaces/pool.interface';

export interface ItemInfo {
  icon: StatusIcon;
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

export enum StatusIcon {
  Error = 'error',
  CheckCircle = 'check_circle',
  MdiAlert = 'mdi-alert',
  MdiCloseCircle = 'mdi-close-circle',
  ArrowCircleRight = 'arrow_circle_right',
  Neutral = 'mdi-minus-circle',
}

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
