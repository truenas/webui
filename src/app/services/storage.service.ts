import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { format } from 'date-fns-tz';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { VdevType, TopologyItemType, TopologyWarning } from 'app/enums/v-dev-type.enum';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Option } from 'app/interfaces/option.interface';
import { Disk, TopologyItem } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services/ws.service';

function isStringArray(items: unknown[]): items is string[] {
  return typeof items[0] === 'string';
}

const specialRedundancyCategories = [VdevType.Dedup, VdevType.Special];
const redundancyCategories = [...specialRedundancyCategories, VdevType.Data];

@Injectable()
export class StorageService {
  protected diskResource = 'disk.query' as const;

  constructor(
    protected ws: WebSocketService,
    private http: HttpClient,
  ) {
  }

  filesystemStat(path: string): Observable<FileSystemStat> {
    return this.ws.call('filesystem.stat', [path]);
  }

  listDisks(): Observable<Disk[]> {
    return this.ws.call(this.diskResource, []);
  }

  downloadFile(filename: string, contents: string, mimeType = 'text/plain'): void {
    const byteCharacters = atob(contents);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], { type: mimeType });

    this.downloadBlob(blob, filename);
  }

  downloadText(contents: string, filename: string): void {
    const blob = new Blob([contents], { type: 'text/plain' });
    this.downloadBlob(blob, filename);
  }

  downloadBlob(blob: Blob, filename: string): void {
    const dlink = document.createElement('a');
    document.body.appendChild(dlink);
    dlink.download = filename;
    dlink.href = URL.createObjectURL(blob);
    dlink.onclick = () => {
      // revokeObjectURL needs a delay to work properly
      setTimeout(() => {
        URL.revokeObjectURL(dlink.href);
      }, 1500);
    };

    dlink.click();
    dlink.remove();
  }

  streamDownloadFile(url: string, filename: string, mimeType: string): Observable<Blob> {
    return this.http.post(url, '',
      { responseType: 'blob' }).pipe(
      map(
        (blob) => {
          return new Blob([blob], { type: mimeType });
        },
      ),
    );
  }

  downloadUrl(url: string, filename: string, mimeType: string): Observable<Blob> {
    return this.streamDownloadFile(url, filename, mimeType).pipe(
      tap((blob) => this.downloadBlob(blob, filename)),
    );
  }

  /**
   * @deprecated Handles sorting for entity tables and some other ngx datatables
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  tableSorter<T>(arr: T[], key: keyof T, asc: SortDirection): T[] {
    const tempArr: unknown[] = [];
    let sorter: unknown[];
    const myCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    // Breaks out the key to sort by
    arr.forEach((item) => {
      tempArr.push(item[key]);
    });

    // If all values are the same, just return the array without sorting or flipping it
    if (!tempArr.some((val, _) => val !== tempArr[0])) {
      return arr;
    }

    // Handle an empty data field or empty column
    let n = 0;
    while (!tempArr[n] && n < tempArr.length) {
      n++;
    }
    // Select table columns labled with GiB, Mib, etc
    // Regex checks for ' XiB' with a leading space and X === K, M, G or T
    // also include bytes unit, which will get from convertBytesToHumanReadable (IxFormatterService) function
    if (isStringArray(tempArr)
      && (tempArr[n].endsWith(' B') || /\s[KMGT]iB$/.test(tempArr[n].slice(-4)) || tempArr[n].endsWith(' bytes'))) {
      let bytes = [];
      let kbytes = [];
      let mbytes = [];
      let gbytes = [];
      let tbytes = [];
      for (const i of tempArr) {
        if (i) {
          if (i.endsWith(' B')) {
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
    } else if (isStringArray(tempArr)
      && tempArr[n][tempArr[n].length - 1].match(/[KMGTB]/)
      && tempArr[n][tempArr[n].length - 2].match(/[0-9]/)) {
      let bytes = [];
      let kiloBytes = [];
      let megaBytes = [];
      let gigaBytes = [];
      let teraBytes = [];
      for (const i of tempArr) {
        switch (i.slice(-1)) {
          case 'B':
            bytes.push(i);
            break;
          case 'K':
            kiloBytes.push(i);
            break;
          case 'M':
            megaBytes.push(i);
            break;
          case 'G':
            gigaBytes.push(i);
            break;
          case 'T':
            teraBytes.push(i);
        }
      }

      // Sort each array independently, then put them back together
      bytes = bytes.sort(myCollator.compare);
      kiloBytes = kiloBytes.sort(myCollator.compare);
      megaBytes = megaBytes.sort(myCollator.compare);
      gigaBytes = gigaBytes.sort(myCollator.compare);
      teraBytes = teraBytes.sort(myCollator.compare);

      sorter = bytes.concat(kiloBytes, megaBytes, gigaBytes, teraBytes);

      // Select strings that Date.parse can turn into a number (ie, that are a legit date)
    } else if (isStringArray(tempArr)
      && !Number.isNaN(Date.parse(tempArr[n]))) {
      let timeArr = [];
      for (const i of tempArr) {
        timeArr.push(Date.parse(i));
      }
      timeArr = timeArr.sort();

      sorter = [];
      for (const elem of timeArr) {
        try {
          sorter.push(format(elem, 'yyyy-MM-dd HH:mm:ss')); // format should match locale service
        } catch (error: unknown) {
          console.error(error);
        }
      }
    } else {
      sorter = tempArr.sort(myCollator.compare);
    }
    // Rejoins the sorted keys with the rest of the row data
    let sort: number;
    // ascending or descending
    if (asc === 'asc') {
      sort = 1;
    } else {
      sort = -1;
    }
    arr.sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      if (sorter.indexOf(aValue) > sorter.indexOf(bValue)) {
        return sort;
      }
      return -1 * sort;
    });

    return arr;
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
    path = path.startsWith('/') ? path.substring(1) : path;

    return !path.includes('/');
  }

  getRedundancyLevel(vdev: TopologyItem): number {
    switch (vdev.type) {
      case TopologyItemType.Disk:
      case TopologyItemType.Stripe:
        return 0;
      case TopologyItemType.Mirror:
        return vdev.children.length - 1;
      case TopologyItemType.Raidz:
      case TopologyItemType.Raidz1:
        return 1;
      case TopologyItemType.Raidz2:
        return 2;
      case TopologyItemType.Raidz3:
        return 3;
      default:
        // VDEV type property also includes values unrelated to layout.
        return -1;
    }
  }

  getVdevWidths(vdevs: TopologyItem[]): Set<number> {
    const allVdevWidths = new Set<number>(); // There should only be one value

    vdevs?.forEach((vdev) => {
      let vdevWidthCounter = 0;

      if (vdev.type === TopologyItemType.Disk || vdev.type === TopologyItemType.Stripe || vdev.children.length === 0) {
        // Width of single disk VDEVs should be 1
        allVdevWidths.add(1);
      } else {
        vdev.children.forEach(() => {
          vdevWidthCounter += 1;
        });
        allVdevWidths.add(vdevWidthCounter);
      }
    });

    return allVdevWidths;
  }

  isMixedWidth(allVdevWidths: Set<number>): boolean {
    return allVdevWidths.size > 1;
  }

  // Get usable space on VDEV.
  getVdevCapacities(vdevs: TopologyItem[]): Set<number> {
    const allVdevCapacities = new Set<number>(); // There should only be one value
    vdevs?.forEach((vdev) => {
      allVdevCapacities.add(vdev.stats.size);
    });
    return allVdevCapacities;
  }

  // Check to see if every VDEV has the same capacity. Best practices dictate every vdev should be uniform
  isMixedVdevCapacity(allVdevCapacities: Set<number>): boolean {
    return allVdevCapacities.size > 1;
  }

  getVdevDiskCapacities(vdevs: TopologyItem[], disks: Disk[]): Set<number>[] {
    const allDiskCapacities: Set<number>[] = [];
    vdevs?.forEach((vdev) => {
      const vdevDiskCapacities = new Set<number>(); // There should only be one value
      if (vdev.children.length) {
        vdev.children.forEach((child) => {
          const diskIndex = disks?.findIndex((disk) => disk.name === child.disk);
          if (diskIndex >= 0 && disks[diskIndex].size) {
            vdevDiskCapacities.add(disks[diskIndex].size);
          }
        });
      } else {
        // Topology items of type DISK will not have children
        vdevDiskCapacities.add(vdev.stats.size);
      }
      allDiskCapacities.push(vdevDiskCapacities);
    });
    return allDiskCapacities;
  }

  // Check to see if any individual VDEVs have non-uniform disk sizes.
  // Every disk in a VDEV should ideally be the same size
  isMixedVdevDiskCapacity(allVdevDiskCapacities: Set<number>[]): boolean {
    const isMixed = allVdevDiskCapacities.filter((vdev) => vdev.size > 1);
    return isMixed.length > 0;
  }

  getVdevTypes(vdevs: TopologyItem[]): Set<string> {
    const vdevTypes = new Set<string>();
    vdevs?.forEach((vdev) => {
      vdevTypes.add(vdev.type);
    });
    return vdevTypes;
  }

  isMixedVdevType(vdevTypes: Set<string>): boolean {
    return vdevTypes.size > 1;
  }

  validateVdevs(
    category: VdevType,
    vdevs: TopologyItem[],
    disks: Disk[],
    dataVdevs?: TopologyItem[],
  ): string[] {
    const warnings: string[] = [];
    let isMixedVdevCapacity = false;
    let isMixedDiskCapacity = false;
    let isMixedWidth = false;
    let isMixedLayout = false;

    // Check for non-uniform VDEV Capacities
    const allVdevCapacities: Set<number> = this.getVdevCapacities(vdevs); // There should only be one value
    isMixedVdevCapacity = this.isMixedVdevCapacity(allVdevCapacities);

    // Check for non-uniform Disk Capacities within each VDEV
    const allVdevDiskCapacities: Set<number>[] = this.getVdevDiskCapacities(vdevs, disks);
    isMixedDiskCapacity = this.isMixedVdevDiskCapacity(allVdevDiskCapacities);

    // Check VDEV Widths
    const allVdevWidths: Set<number> = this.getVdevWidths(vdevs); // There should only be one value
    isMixedWidth = this.isMixedWidth(allVdevWidths);

    // While not recommended, ZFS does allow creating a pool with mixed VDEV types.
    // Even though the UI does not allow such pools to be created,
    // users might still try to import such a pool.
    const allVdevLayouts = this.getVdevTypes(vdevs);
    isMixedLayout = this.isMixedVdevType(allVdevLayouts);

    if (vdevs.length) {
      if (isMixedLayout) {
        warnings.push(TopologyWarning.MixedVdevLayout);
      }

      if (isMixedDiskCapacity) {
        warnings.push(TopologyWarning.MixedDiskCapacity);
      }

      if (isMixedVdevCapacity) {
        warnings.push(TopologyWarning.MixedVdevCapacity);
      }

      if (isMixedWidth) {
        warnings.push(TopologyWarning.MixedVdevWidth);
      }

      // Check Redundancy
      if (redundancyCategories.includes(category) && this.hasZeroRedundancyLevelVdev(vdevs)) {
        warnings.push(TopologyWarning.NoRedundancy);
      }

      // Check that special & dedup VDEVs have same redundancy level as data VDEVs
      if (specialRedundancyCategories.includes(category) && this.isSpecialRedundancyMismatch(vdevs, dataVdevs)) {
        warnings.push(TopologyWarning.RedundancyMismatch);
      }
    }

    return warnings;
  }

  private hasZeroRedundancyLevelVdev(vdevs: TopologyItem[]): boolean {
    return vdevs.filter((vdev) => this.getRedundancyLevel(vdev) === 0).length > 0;
  }

  private getUniqueRedundancyLevels(vdevs: TopologyItem[]): number[] {
    return Array.from(new Set(vdevs.map((vdev) => this.getRedundancyLevel(vdev)))).sort((a, b) => a - b);
  }

  private isSpecialRedundancyMismatch(vdevs: TopologyItem[], dataVdevs: TopologyItem[]): boolean {
    const uniqueVdevsLevels = this.getUniqueRedundancyLevels(vdevs);
    const uniqueDataVdevsLevels = this.getUniqueRedundancyLevels(dataVdevs);

    return (
      (uniqueVdevsLevels.length > 1 || uniqueDataVdevsLevels.length > 1)
      || (uniqueVdevsLevels[0] < uniqueDataVdevsLevels[0]));
  }
}
