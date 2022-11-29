import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

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
        result = value / 1024;
        break;
      case 'MB':
        units = T('MiB');
        result = value / 1024 / 1024;
        break;
      case 'GB':
        units = T('GiB');
        result = value / 1024 / 1024 / 1024;
        break;
      case 'TB':
        units = T('TiB');
        result = value / 1024 / 1024 / 1024 / 1024;
        break;
      case 'PB':
        units = T('PiB');
        result = value / 1024 / 1024 / 1024 / 1024 / 1024;
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
    if (value > 1024 && value < (1024 * 1024)) {
      units = 'KB';
    } else if (value >= (1024 * 1024) && value < (1024 * 1024 * 1024)) {
      units = 'MB';
    } else if (value >= (1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024)) {
      units = 'GB';
    } else if (value >= (1024 * 1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024 * 1024)) {
      units = 'TB';
    }

    return units;
  }
}
