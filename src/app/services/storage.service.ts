import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { format } from 'date-fns-tz';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Option } from 'app/interfaces/option.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebSocketService } from './ws.service';

@Injectable()
export class StorageService {
  protected diskResource: 'disk.query' = 'disk.query';

  ids: string[];
  diskNames: string[];
  hddStandby: DiskStandby;
  diskToggleStatus: boolean;
  SMARToptions: string;
  advPowerMgt: DiskPowerLevel;
  humanReadable: string;
  IECUnits = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  constructor(protected ws: WebSocketService) {}

  filesystemStat(path: string): Observable<FileSystemStat> {
    return this.ws.call('filesystem.stat', [path]);
  }

  listDisks(): Observable<Disk[]> {
    return this.ws.call(this.diskResource, []);
  }

  downloadFile(filename: string, contents: string, mime_type: string): void {
    mime_type = mime_type || 'text/plain';

    const byteCharacters = atob(contents);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], { type: mime_type });

    this.downloadBlob(blob, filename);
  }

  downloadBlob(blob: Blob, filename: string): void {
    const dlink = document.createElement('a');
    document.body.appendChild(dlink);
    dlink.download = filename;
    dlink.href = window.URL.createObjectURL(blob);
    dlink.onclick = () => {
      // revokeObjectURL needs a delay to work properly
      setTimeout(() => {
        window.URL.revokeObjectURL((this as any).href);
      }, 1500);
    };

    dlink.click();
    dlink.remove();
  }

  streamDownloadFile(http: HttpClient, url: string, filename: string, mime_type: string): Observable<Blob> {
    return http.post(url, '',
      { responseType: 'blob' }).pipe(
      map(
        (res) => {
          const blob = new Blob([res], { type: mime_type });
          return blob;
        },
      ),
    );
  }

  // Handles sorting for entity tables and some other ngx datatables
  tableSorter<T>(arr: T[], key: keyof T, asc: SortDirection): T[] {
    const tempArr: any[] = [];
    let sorter: any;
    const myCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    // Breaks out the key to sort by
    arr.forEach((item) => {
      tempArr.push(item[key]);
    });

    // If all values are the same, just return the array without sorting or flipping it
    if (!tempArr.some((val, i, arr) => val !== arr[0])) {
      return arr;
    }

    // Handle an empty data field or empty column
    let n = 0;
    while (!tempArr[n] && n < tempArr.length) {
      n++;
    }
    // Select table columns labled with GiB, Mib, etc
    // Regex checks for ' XiB' with a leading space and X === K, M, G or T
    // also include bytes unit, which will get from convertBytestoHumanReadable function
    if (typeof (tempArr[n]) === 'string'
      && (tempArr[n].slice(-2) === ' B' || /\s[KMGT]iB$/.test(tempArr[n].slice(-4)) || tempArr[n].slice(-6) === ' bytes')) {
      let bytes = []; let kbytes = []; let mbytes = []; let gbytes = []; let
        tbytes = [];
      for (const i of tempArr) {
        if (i) {
          if (i.slice(-2) === ' B') {
            bytes.push(i);
          } else {
            switch (i.slice(-3)) {
              case 'KiB':
                kbytes.push(i);
                break;
              case 'MiB':
                mbytes.push(i);
                break;
              case 'GiB':
                gbytes.push(i);
                break;
              case 'TiB':
                tbytes.push(i);
            }
          }
        }
      }

      // Sort each array independently, then put them back together
      bytes = bytes.sort(myCollator.compare);
      kbytes = kbytes.sort(myCollator.compare);
      mbytes = mbytes.sort(myCollator.compare);
      gbytes = gbytes.sort(myCollator.compare);
      tbytes = tbytes.sort(myCollator.compare);

      sorter = bytes.concat(kbytes, mbytes, gbytes, tbytes);

      // Select disks where last two chars = a digit and the one letter space abbrev
    } else if (typeof (tempArr[n]) === 'string'
      && tempArr[n][tempArr[n].length - 1].match(/[KMGTB]/)
      && tempArr[n][tempArr[n].length - 2].match(/[0-9]/)) {
      let B = []; let K = []; let M = []; let G = []; let
        T = [];
      for (const i of tempArr) {
        switch (i.slice(-1)) {
          case 'B':
            B.push(i);
            break;
          case 'K':
            K.push(i);
            break;
          case 'M':
            M.push(i);
            break;
          case 'G':
            G.push(i);
            break;
          case 'T':
            T.push(i);
        }
      }

      // Sort each array independently, then put them back together
      B = B.sort(myCollator.compare);
      K = K.sort(myCollator.compare);
      M = M.sort(myCollator.compare);
      G = G.sort(myCollator.compare);
      T = T.sort(myCollator.compare);

      sorter = B.concat(K, M, G, T);

    // Select strings that Date.parse can turn into a number (ie, that are a legit date)
    } else if (typeof (tempArr[n]) === 'string'
      && !isNaN(Date.parse(tempArr[n]))) {
      let timeArr = [];
      for (const i of tempArr) {
        timeArr.push(Date.parse(i));
      }
      timeArr = timeArr.sort();

      sorter = [];
      for (const elem of timeArr) {
        sorter.push(format(elem, 'yyyy-MM-dd HH:mm:ss')); // formate should matched locale service
      }
    } else {
      sorter = tempArr.sort(myCollator.compare);
    }
    // Rejoins the sorted keys with the rest of the row data
    let v: number;
    // ascending or decending
    if (asc === 'asc') {
      (v = 1);
    } else {
      (v = -1);
    }
    arr.sort((a, b) => {
      const A = a[key];
      const B = b[key];
      if (sorter.indexOf(A) > sorter.indexOf(B)) {
        return v;
      }
      return -1 * v;
    });

    return arr;
  }

  // This section passes data from disk-list to disk-bulk-edit form
  diskIdsBucket(arr: string[]): void {
    this.ids = arr;
  }

  diskNamesBucket(arr: string[]): void {
    this.diskNames = arr;
  }

  diskToggleBucket(bool: boolean): void {
    this.diskToggleStatus = bool;
  }

  diskNameSort(disks: any[]): void {
    for (let i = 0; i < disks.length; i++) {
      for (let j = 0; j < disks.length - i - 1; j++) {
        const k = j + 1;
        const disk1name = disks[j].match(/\w+/);
        const disk1num = parseInt(disks[j].match(/\d+/), 10);
        const disk2name = disks[k].match(/\w+/);
        const disk2num = parseInt(disks[k].match(/\d+/), 10);

        if (disk1name > disk2name || disk1num > disk2num) {
          const temp = disks[j];
          disks[j] = disks[k];
          disks[k] = temp;
        }
      }
    }
  }

  poolUnlockServiceOptions(id: number): Observable<Option[]> {
    return this.ws.call('pool.unlock_services_restart_choices', [id]).pipe(
      map((response: Choices) =>
        Object.keys(response || {}).map((serviceId) => ({
          label: response[serviceId],
          value: serviceId,
        }))),
    );
  }

  getDatasetNameOptions(): Observable<Option[]> {
    return this.ws
      .call('pool.filesystem_choices')
      .pipe(map((response) => response.map((value) => ({ label: value, value }))));
  }

  /**
   * @param path The path of the dataset excluding "/mnt/"
   */
  isDatasetTopLevel(path: string): boolean {
    if (typeof path !== 'string') {
      throw new Error('isDatasetTopLevel received "path" parameter that is not of type "string."');
    }

    /**
     * Strip leading forward slash if present
     * /zpool/d0 -> zpool/d0
     */
    path = path.indexOf('/') === 0 ? path.substr(1) : path;

    return !path.includes('/');
  }

  // ----------------------- //

  normalizeUnit(unitStr: string): string {
    // normalize short units ("MB") or human units ("M") to IEC units ("MiB")
    // unknown values return undefined

    // empty unit is valid, just return
    if (!unitStr) {
      return '';
    }

    const IECUnitsStr = this.IECUnits.join('|');
    const shortUnitsStr = this.IECUnits.map((unit) => unit.charAt(0) + unit.charAt(2)).join('|');
    const humanUnitsStr = this.IECUnits.map((unit) => unit.charAt(0)).join('|');
    const allUnitsStr = (IECUnitsStr + '|' + shortUnitsStr + '|' + humanUnitsStr).toUpperCase();
    const unitsRE = new RegExp('^\\s*(' + allUnitsStr + '){1}\\s*$');

    unitStr = unitStr.toUpperCase();
    if (unitStr.match(unitsRE)) {
      // always return IEC units
      // could take a parameter to return short or human units
      return unitStr.charAt(0).toUpperCase() + 'iB';
    }
    return undefined;
  }

  convertUnitToNum(unitStr: string): number {
    // convert IEC ("MiB"), short ("MB"), or human ("M") units to numbers
    // unknown units are evaluated as 1

    unitStr = this.normalizeUnit(unitStr);
    if (!unitStr) {
      return 1;
    }
    return (1024 ** (this.IECUnits.indexOf(unitStr) + 1));
  }

  // sample data, input and return values
  // input       normalized       number value
  // '12345'     '12345'          12345
  // '512x'      ''               NaN
  // '0'         '0'              0
  // '0b'        ''               NaN
  // '',         '0'              0
  // '4MB',      '4 MiB'          4*1024**2 (4,194,304)
  // '16KiB'     '16 KiB'         16*1024   (16,384)
  // 'g'         ''               NaN
  // ' t1'       ''               NaN
  // '   5   m'  '5 MiB'          5*1024**2 (5,242,880)
  // '1m',       '1 MiB'          1024**2   (1,048,576)
  // '    T'     ''               NaN
  // '2 MiB  '   '2 MiB'          2*1024**2 (2,097,152)
  // '2 MiB x8'  ''               NaN
  // '256 k'     '256 KiB'        256*1024  (262,144)
  // 'm4m k'     ''               NaN
  // '4m k'      ''               NaN
  // '1.2m'      ''               NaN
  // '12k4'      ''               NaN
  // '12.4k'     ''               NaN
  // ' 10G'      '10 GiB'         10*1024**3 (10,737,418,240)

  // hstr = the human string from the form;
  // dec = allow decimals;
  // allowedUnits (optional) should include any or all of 'kmgtp', the first letters of KiB, Mib, etc. The first letter
  // is used as the default, so for 'gtp', an entered value of 256 becomes 256 GiB. If you don't pass in allowedUnits,
  // all of the above are accepted AND no unit is attached to an unlabeled number, so 256 is considered 256 bytes.
  convertHumanStringToNum(hstr: any, dec = false, allowedUnits?: string): number {
    let num = 0;
    let unit = '';

    // empty value is evaluated as zero
    if (!hstr) {
      this.humanReadable = '0';
      return 0;
    }

    // remove whitespace
    hstr = hstr.replace(/\s+/g, '');

    // get leading number
    let match = [];
    if (dec) {
      match = hstr.match(/^(\d+(\.\d+)?)/);
    } else {
      match = hstr.match(/^(\d+)/);
    }
    if (match && match.length > 1) {
      num = match[1];
    } else {
      // leading number is required
      this.humanReadable = '';
      return NaN;
    }

    // get optional unit
    unit = hstr.replace(num, '');
    if (!unit && allowedUnits) {
      unit = allowedUnits[0];
    }
    // error when unit is present and...
    if ((unit)
          // ...allowedUnits are passed in but unit is not in allowed Units
          && (allowedUnits && !allowedUnits.toLowerCase().includes(unit[0].toLowerCase())
          // ...when allowedUnits are not passed in and unit is not recognized
          || !(unit = this.normalizeUnit(unit)))) {
      this.humanReadable = '';
      return NaN;
    }

    const spacer = (unit) ? ' ' : '';

    this.humanReadable = num.toString() + spacer + unit;
    return num * this.convertUnitToNum(unit);
  }

  // Converts a number from bytes to the most natural human readable format
  convertBytestoHumanReadable(
    rawBytes: number | string,
    decimalPlaces?: number,
    minUnits?: string,
    hideBytes?: boolean,
  ): string {
    let i = -1;
    let units;
    let bytes = Number(rawBytes);

    const dec = decimalPlaces !== undefined ? decimalPlaces : 2;
    if (bytes >= 1024) {
      do {
        bytes = bytes / 1024;
        i++;
      } while (bytes >= 1024 && i < 4);
      units = this.IECUnits[i];
    } else if (minUnits) {
      units = minUnits;
    } else {
      units = hideBytes ? '' : 'bytes';
    }
    return `${bytes.toFixed(dec)} ${units}`;
  }
}
