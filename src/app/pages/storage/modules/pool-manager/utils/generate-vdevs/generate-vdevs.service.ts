import { Injectable } from '@angular/core';
import _ from 'lodash';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';
import {
  topologyCategoryToDisks,
} from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

export type GeneratedVdevs = {
  [type in VdevType]: UnusedDisk[][];
};

export type TypeAndCategory = [VdevType, PoolManagerTopologyCategory];

@Injectable()
export class GenerateVdevsService {
  generateVdevs({
    allowedDisks,
    topology,
    maximizeDispersal,
  }: {
    allowedDisks: UnusedDisk[];
    topology: PoolManagerTopology;
    maximizeDispersal: boolean;
  }): GeneratedVdevs {
    let disks = this.excludeManualSelectionDisks([...allowedDisks], topology);
    disks = this.sortDisksByEnclosure(disks);
    if (maximizeDispersal) {
      disks = this.sortDisksToMaximizeDispersal(disks);
    }
    const groupedDisks = getDiskTypeSizeMap(disks);

    const categories = this.excludeManualCategories(topology);

    // Place disks in categories
    const generatedVdevs = {} as GeneratedVdevs;
    categories.forEach(([type, category]) => {
      if (!this.isCategorySet(category)) {
        generatedVdevs[type] = [];
        return;
      }

      const suitableDisks = this.findSuitableDisks(groupedDisks, category);
      if (suitableDisks?.length < this.getDisksNeeded(category)) {
        throw new Error('Not enough disks to generate vdevs');
      }

      const vdevs: UnusedDisk[][] = [];
      for (let i = 0; i < category.vdevsNumber; i++) {
        vdevs.push(suitableDisks.splice(0, category.width));
      }

      generatedVdevs[type] = vdevs;
    });

    return generatedVdevs;
  }

  private excludeManualSelectionDisks(disks: UnusedDisk[], topology: PoolManagerTopology): UnusedDisk[] {
    const manualSelectionDisks = Object.values(topology).reduce((acc, category) => {
      if (!category.hasCustomDiskSelection) return acc;
      return topologyCategoryToDisks(category);
    }, []);

    return disks.filter((disk) => !manualSelectionDisks.includes(disk));
  }

  private sortDisksToMaximizeDispersal(disks: UnusedDisk[]): UnusedDisk[] {
    const disksByEnclosure = _.groupBy(disks, (disk) => disk.enclosure?.number || -1);
    const dispersedDisks: UnusedDisk[] = [];
    // Keep taking 1 disk from each enclosure until there are no more disks left.
    while (Object.keys(disksByEnclosure).length > 0) {
      Object.entries(disksByEnclosure).forEach(([enclosure, enclosureDisks]) => {
        dispersedDisks.push(enclosureDisks.shift());
        if (enclosureDisks.length === 0) {
          delete disksByEnclosure[enclosure];
        }
      });
    }

    return dispersedDisks;
  }

  /**
   * Sort by enclosure and slot, and if empty by devname
   */
  private sortDisksByEnclosure(disks: UnusedDisk[]): UnusedDisk[] {
    const largeNumber = Number.MAX_VALUE;
    return disks.sort((a, b) => {
      if (a.enclosure?.number === b.enclosure?.number) {
        if (a.enclosure?.slot === b.enclosure?.slot) {
          return a.devname.localeCompare(b.devname);
        }
        return (a.enclosure?.slot || largeNumber) - (b.enclosure?.slot || largeNumber);
      }

      return (a.enclosure?.number || largeNumber) - (b.enclosure?.number || largeNumber);
    });
  }

  private excludeManualCategories(topology: PoolManagerTopology): TypeAndCategory[] {
    return Object.entries(topology)
      .filter(([, category]) => !category.hasCustomDiskSelection)
      .map(([type, category]) => [type as VdevType, category]);
  }

  private isCategorySet(category: PoolManagerTopologyCategory): boolean {
    return Boolean(category.layout
      && category.width > 0
      && category.vdevsNumber > 0
      && category.diskSize
      && category.diskType);
  }

  private findSuitableDisks(groupedDisks: DiskTypeSizeMap, category: PoolManagerTopologyCategory): UnusedDisk[] {
    const matchingType = groupedDisks[category.diskType];
    // TODO: Add support for treatDiskSizeAsMinimum
    return matchingType[category.diskSize];
  }

  private getDisksNeeded(category: PoolManagerTopologyCategory): number {
    return category.width * category.vdevsNumber;
  }
}
