import { PoolTopology } from 'app/interfaces/pool.interface';
import { iconMarker, MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

export interface ItemInfo {
  icon: MarkedIcon;
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
  error: iconMarker('error'),
  checkCircle: iconMarker('check_circle'),
  mdiAlert: iconMarker('mdi-alert'),
  mdiCloseCircle: iconMarker('mdi-close-circle'),
  arrowCircleRight: iconMarker('arrow_circle_right'),
  neutral: iconMarker('mdi-minus-circle'),
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
