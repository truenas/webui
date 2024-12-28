import { Injectable } from '@angular/core';
import { differenceWith, isEmpty } from 'lodash-es';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
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
  [type in VdevType]: DetailsDisk[][];
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
    categorySequence,
  }: {
    allowedDisks: DetailsDisk[];
    topology: PoolManagerTopology;
    maximizeDispersal: boolean;
    categorySequence: VdevType[];
  }): GeneratedVdevs {
    let disks = this.excludeManualSelectionDisks([...allowedDisks], topology);
    disks = this.sortDisksByEnclosure(disks);
    this.groupedDisks = new GroupedDisks(disks);
    this.enclosureList = new EnclosureList(disks);

    const categories = this.generateCategories(topology, categorySequence);

    return this.placeDisksInCategories(categories, maximizeDispersal);
  }

  private placeDisksInCategories(categories: TypeAndCategory[], maximizeDispersal: boolean): GeneratedVdevs {
    const generatedVdevs = {} as GeneratedVdevs;
    categories.forEach(([type, category]) => {
      if (!this.isCategorySet(category)) {
        generatedVdevs[type] = [];
        return;
      }

      const vdevs: DetailsDisk[][] = [];
      for (let i = 0; i < category.vdevsNumber; i++) {
        vdevs.push(this.pickDisks(category, maximizeDispersal));
      }

      generatedVdevs[type] = vdevs;
    });

    return generatedVdevs;
  }

  private excludeManualSelectionDisks(disks: DetailsDisk[], topology: PoolManagerTopology): DetailsDisk[] {
    const manualSelectionDisks = Object.values(topology).reduce((acc, category) => {
      if (!category.hasCustomDiskSelection) return acc;
      return topologyCategoryToDisks(category);
    }, [] as DetailsDisk[]);

    return differenceWith(
      disks,
      manualSelectionDisks,
      (disk, manualSelectionDisk) => disk.name === manualSelectionDisk.name,
    );
  }

  /**
   * Sort by enclosure and slot, and if empty by devname
   */
  private sortDisksByEnclosure(disks: DetailsDisk[]): DetailsDisk[] {
    return disks.sort((a, b) => {
      if (a.enclosure?.id === b.enclosure?.id) {
        if (a.enclosure?.drive_bay_number === b.enclosure?.drive_bay_number) {
          return a.devname.localeCompare(b.devname);
        }
        return (a.enclosure?.drive_bay_number || 0) - (b.enclosure?.drive_bay_number || 0);
      }

      if (isEmpty(a.enclosure) || isEmpty(b.enclosure)) {
        // Put disks without enclosure at the end
        return a.enclosure?.id ? -1 : 1;
      }

      return a.enclosure.id.localeCompare(b.enclosure.id);
    });
  }

  private generateCategories(topology: PoolManagerTopology, categorySequence: VdevType[]): TypeAndCategory[] {
    return categorySequence
      .filter((category) => topology[category] && !topology[category].hasCustomDiskSelection)
      .map((category) => [category, topology[category]]);
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
  ): DetailsDisk[] {
    const disksNeeded = category.width;
    const suitableDisks = this.groupedDisks.findSuitableDisks(category);

    if (suitableDisks.length < disksNeeded) {
      return [];
    }
    suitableDisks.sort((a, b) => a.size - b.size);

    let pickedDisks: DetailsDisk[];
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
  private pickDisksWithDispersal(suitableDisks: DetailsDisk[], disksNeeded: number): DetailsDisk[] {
    let remainingDisks = [...suitableDisks];
    const pickedDisks: DetailsDisk[] = [];
    while (pickedDisks.length < disksNeeded && remainingDisks.length > 0) {
      let nextEnclosure = this.enclosureList.next();
      let pickedDisk: DetailsDisk | undefined;

      do {
        pickedDisk = remainingDisks.find((disk) => disk.enclosure?.id === nextEnclosure);
        if (!pickedDisk) nextEnclosure = this.enclosureList.next();
      } while (!pickedDisk);

      pickedDisks.push(pickedDisk);
      remainingDisks = remainingDisks.filter((disk) => disk !== pickedDisk);
    }
    return pickedDisks;
  }
}
