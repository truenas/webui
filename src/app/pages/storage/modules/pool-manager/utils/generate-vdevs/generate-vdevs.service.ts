import { Injectable } from '@angular/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { EnclosureList } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/enclosure-list.class';
import { GroupedDisks } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/grouped-disks.class';
import {
  topologyCategoryToDisks,
} from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

export type GeneratedVdevs = {
  [type in VdevType]: UnusedDisk[][];
};

export type TypeAndCategory = [VdevType, PoolManagerTopologyCategory];

@Injectable()
export class GenerateVdevsService {
  private enclosureList: EnclosureList;
  private groupedDisks: GroupedDisks;

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
    this.groupedDisks = new GroupedDisks(disks);
    this.enclosureList = new EnclosureList(disks);

    const categories = this.excludeManualCategories(topology);

    return this.placeDisksInCategories(categories, maximizeDispersal);
  }

  private placeDisksInCategories(categories: TypeAndCategory[], maximizeDispersal: boolean): GeneratedVdevs {
    const generatedVdevs = {} as GeneratedVdevs;
    categories.forEach(([type, category]) => {
      if (!this.isCategorySet(category)) {
        generatedVdevs[type] = [];
        return;
      }

      const vdevs: UnusedDisk[][] = [];
      for (let i = 0; i < category.vdevsNumber; i++) {
        vdevs.push(this.pickDisks(category, maximizeDispersal));
      }

      generatedVdevs[type] = vdevs;
    });

    return generatedVdevs;
  }

  private excludeManualSelectionDisks(disks: UnusedDisk[], topology: PoolManagerTopology): UnusedDisk[] {
    const manualSelectionDisks = Object.values(topology).reduce((acc, category) => {
      if (!category.hasCustomDiskSelection) return acc;
      return topologyCategoryToDisks(category);
    }, [] as UnusedDisk[]);

    return disks.filter((disk) => !manualSelectionDisks.includes(disk));
  }

  /**
   * Sort by enclosure and slot, and if empty by devname
   */
  private sortDisksByEnclosure(disks: UnusedDisk[]): UnusedDisk[] {
    // Use large number to put disks without enclosure at the end
    const largeNumber = Number.MAX_VALUE;
    return disks.sort((a, b) => {
      if (a.enclosure?.number === b.enclosure?.number) {
        if (a.enclosure?.slot === b.enclosure?.slot) {
          return a.devname.localeCompare(b.devname);
        }
        return a.enclosure?.slot - b.enclosure?.slot;
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

  private pickDisks(
    category: PoolManagerTopologyCategory,
    maximizeDispersal: boolean,
  ): UnusedDisk[] {
    const disksNeeded = category.width;
    const suitableDisks = this.groupedDisks.findSuitableDisks(category);

    if (suitableDisks.length < disksNeeded) {
      return [];
    }

    let pickedDisks: UnusedDisk[] = [];
    if (maximizeDispersal) {
      pickedDisks = this.pickDisksWithDispersal(suitableDisks, disksNeeded);
    } else {
      pickedDisks = suitableDisks.slice(0, disksNeeded);
    }

    this.groupedDisks.removeUsedDisks(pickedDisks);
    return pickedDisks;
  }

  /**
   * Tries to pick disk from one enclosure, then from another, etc.
   */
  private pickDisksWithDispersal(suitableDisks: UnusedDisk[], disksNeeded: number): UnusedDisk[] {
    let remainingDisks = [...suitableDisks];
    const pickedDisks: UnusedDisk[] = [];
    while (pickedDisks.length < disksNeeded && remainingDisks.length > 0) {
      let nextEnclosure = this.enclosureList.next();
      let pickedDisk: UnusedDisk;

      do {
        pickedDisk = remainingDisks.find((disk) => disk.enclosure?.number === nextEnclosure);
        if (!pickedDisk) nextEnclosure = this.enclosureList.next();
      } while (!pickedDisk);

      pickedDisks.push(pickedDisk);
      remainingDisks = remainingDisks.filter((disk) => disk !== pickedDisk);
    }
    return pickedDisks;
  }
}
