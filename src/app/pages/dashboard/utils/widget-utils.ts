import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  GiB, KiB, MiB, PiB, TiB,
} from 'app/constants/bytes.constant';

interface Converted {
  value: string;
  units: string;
}

export class WidgetUtils {
  /**
   * Only useful when you need number and unit separately.
   * Use`filesize { standard: 'iec' }` package or `filesize` pipe for most use cases.
   */
  convert(value: number): Converted {
    let result: number;
    let units: string;

    // uppercase so we handle bits and bytes...
    switch (this.optimizeUnits(value)) {
      case 'B':
      case 'KB':
        units = T('KiB');
        result = value / KiB;
        break;
      case 'MB':
        units = T('MiB');
        result = value / MiB;
        break;
      case 'GB':
        units = T('GiB');
        result = value / GiB;
        break;
      case 'TB':
        units = T('TiB');
        result = value / TiB;
        break;
      case 'PB':
        units = T('PiB');
        result = value / PiB;
        break;
      default:
        units = T('KiB');
        result = 0.00;
    }

    return result ? { value: result.toFixed(2), units } : { value: '0.00', units };
  }

  optimizeUnits(value: number): string {
    value = Math.abs(value);
    let units = 'B';
    if (value > 1024 && value < MiB) {
      units = 'KB';
    } else if (value >= MiB && value < GiB) {
      units = 'MB';
    } else if (value >= GiB && value < TiB) {
      units = 'GB';
    } else if (value >= TiB && value < PiB) {
      units = 'TB';
    }

    return units;
  }
}
