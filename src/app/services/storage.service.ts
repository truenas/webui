import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { TopologyItemType, TopologyWarning, VdevType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Option } from 'app/interfaces/option.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  protected diskResource = 'disk.query' as const;

  constructor(
    protected api: ApiService,
  ) {}

  filesystemStat(path: string): Observable<FileSystemStat> {
    return this.api.call('filesystem.stat', [path]);
  }

  listDisks(): Observable<Disk[]> {
    return this.api.call(this.diskResource, []);
  }

  getDatasetNameOptions(): Observable<Option[]> {
    return this.api
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
    const max = Math.max(...allVdevCapacities);
    const min = Math.min(...allVdevCapacities);
    const fivePercentOfMax = max * (5 / 100);

    return min + fivePercentOfMax + GiB * 2 < max;
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
      if (
        [VdevType.Data, VdevType.Dedup, VdevType.Special].includes(category)
        && this.hasZeroRedundancyLevelVdev(vdevs)
      ) {
        warnings.push(TopologyWarning.NoRedundancy);
      }
    }

    return warnings;
  }

  private hasZeroRedundancyLevelVdev(vdevs: TopologyItem[]): boolean {
    return vdevs.filter((vdev) => this.getRedundancyLevel(vdev) === 0).length > 0;
  }
}
