import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges, inject } from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { cloneDeep } from 'lodash-es';
import {
  CreateVdevLayout, TopologyItemType, VDevType, vdevTypeLabels,
} from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TopologyCategoryDescriptionPipe } from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { PoolManagerTopology, PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

const defaultCategory: PoolManagerTopologyCategory = {
  layout: null,
  width: null,
  diskSize: null,
  diskType: null,
  vdevsNumber: null,
  treatDiskSizeAsMinimum: false,
  vdevs: [],
  hasCustomDiskSelection: false,
  draidSpareDisks: null,
  draidDataDisks: null,
};
@UntilDestroy()
@Component({
  selector: 'ix-existing-configuration-preview',
  templateUrl: './existing-configuration-preview.component.html',
  styleUrls: ['./existing-configuration-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    TranslateModule,
    CastPipe,
    FileSizePipe,
    MapValuePipe,
    KeyValuePipe,
    TopologyCategoryDescriptionPipe,
  ],
})
export class ExistingConfigurationPreviewComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);

  readonly name = input.required<string>();
  readonly topology = input.required<PoolTopology>();
  readonly size = input<number>();
  readonly disks = input.required<DetailsDisk[]>();

  protected readonly vDevType = VDevType;

  protected readonly vdevTypeLabels = vdevTypeLabels;
  protected poolTopology: PoolManagerTopology;
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  ngOnChanges(simpleChanges: IxSimpleChanges<ExistingConfigurationPreviewComponent>): void {
    if (simpleChanges.topology.currentValue) {
      this.poolTopology = this.parseTopology(this.topology());
      this.cdr.markForCheck();
    }
  }

  // TODO: Messy. Refactor.
  parseTopology(topology: PoolTopology): PoolManagerTopology {
    const managerTopology = {} as PoolManagerTopology;

    const vdevTypes = this.getExistingVdevTypes(topology);
    for (const type of vdevTypes) {
      managerTopology[type] = cloneDeep(defaultCategory);

      let firstVdevType = topology[type][0].type;
      if (firstVdevType === TopologyItemType.Disk && !topology[type][0].children?.length) {
        firstVdevType = TopologyItemType.Stripe;
      }
      managerTopology[type].layout = firstVdevType as unknown as CreateVdevLayout;

      const allCategoryVdevsDisks = [];
      for (const vdev of topology[type]) {
        if (
          managerTopology[type].width !== null
          && managerTopology[type].width !== (vdev.children?.length || 1)
        ) {
          managerTopology[type].hasCustomDiskSelection = true;
        }
        managerTopology[type].width = vdev.children?.length || 1;

        if (firstVdevType === TopologyItemType.Stripe) {
          const vdevDisk = this.disks().find((disk) => disk.devname === vdev.disk);
          allCategoryVdevsDisks.push(cloneDeep(vdevDisk));
          managerTopology[type].vdevs.push([cloneDeep(vdevDisk)]);
        } else {
          const vdevDisks = [];
          for (const vdevDisk of vdev.children) {
            const fullDisk = this.disks().find((disk) => disk.devname === vdevDisk.disk);
            allCategoryVdevsDisks.push(cloneDeep(fullDisk));
            vdevDisks.push(cloneDeep(fullDisk));
          }
          managerTopology[type].vdevs.push(vdevDisks);
        }
      }
      const firstDisk = cloneDeep(allCategoryVdevsDisks[0]);
      managerTopology[type].hasCustomDiskSelection = managerTopology[type].hasCustomDiskSelection
        || allCategoryVdevsDisks.some((disk) => disk.size !== firstDisk.size || disk.type !== firstDisk.type);
      if (!managerTopology[type].hasCustomDiskSelection) {
        managerTopology[type].diskSize = firstDisk.size;
        managerTopology[type].diskType = firstDisk.type;
        managerTopology[type].vdevsNumber = topology[type].length;
      }
    }
    return managerTopology;
  }

  private getExistingVdevTypes(topology: PoolTopology): VDevType[] {
    let vdevTypes = Object.values(VDevType);
    if (topology.data[0].type === TopologyItemType.Draid) {
      vdevTypes = vdevTypes.filter((type) => type !== VDevType.Spare);
    }

    return vdevTypes.filter((type) => {
      return Object.keys(topology).includes(type) && topology[type].length > 0;
    });
  }
}
