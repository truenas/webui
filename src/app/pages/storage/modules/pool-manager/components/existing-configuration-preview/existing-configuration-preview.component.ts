import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { cloneDeep } from 'lodash-es';
import {
  CreateVdevLayout, TopologyItemType, VdevType, vdevTypeLabels,
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
  standalone: true,
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
  @Input() name: string;
  @Input() topology: PoolTopology;
  @Input() size: number;
  @Input() disks: DetailsDisk[];

  VdevType = VdevType;

  protected readonly vdevTypeLabels = vdevTypeLabels;
  protected poolTopology: PoolManagerTopology;
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  get unknownProp(): string {
    return this.translate.instant('None');
  }

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(simpleChanges: IxSimpleChanges<ExistingConfigurationPreviewComponent>): void {
    if (simpleChanges.topology.currentValue) {
      this.poolTopology = this.parseTopology(this.topology);
      this.cdr.markForCheck();
    }
  }

  parseTopology(topology: PoolTopology): PoolManagerTopology {
    const poolManagerTopology: PoolManagerTopology = {
      data: cloneDeep(defaultCategory),
      log: cloneDeep(defaultCategory),
      spare: cloneDeep(defaultCategory),
      cache: cloneDeep(defaultCategory),
      dedup: cloneDeep(defaultCategory),
      special: cloneDeep(defaultCategory),
    };

    let vdevTypes = Object.entries(VdevType);
    if (this.topology.data[0].type === TopologyItemType.Draid) {
      vdevTypes = vdevTypes.filter(([, type]) => type !== VdevType.Spare);
    }
    for (const [, value] of vdevTypes) {
      if (!topology[value]?.length) {
        continue;
      }

      let firstVdevType = topology[value][0].type;
      if (firstVdevType === TopologyItemType.Disk && !topology[value][0].children?.length) {
        firstVdevType = TopologyItemType.Stripe;
      }
      poolManagerTopology[value].layout = firstVdevType as unknown as CreateVdevLayout;

      const allCategoryVdevsDisks = [];
      for (const vdev of topology[value]) {
        if (
          poolManagerTopology[value].width !== null
          && poolManagerTopology[value].width !== (vdev.children?.length || 1)
        ) {
          poolManagerTopology[value].hasCustomDiskSelection = true;
        }
        poolManagerTopology[value].width = vdev.children?.length || 1;

        if (firstVdevType === TopologyItemType.Stripe) {
          const vdevDisk = this.disks.find((disk) => disk.devname === vdev.disk);
          allCategoryVdevsDisks.push(cloneDeep(vdevDisk));
          poolManagerTopology[value].vdevs.push([cloneDeep(vdevDisk)]);
        } else {
          const vdevDisks = [];
          for (const vdevDisk of vdev.children) {
            const fullDisk = this.disks.find((disk) => disk.devname === vdevDisk.disk);
            allCategoryVdevsDisks.push(cloneDeep(fullDisk));
            vdevDisks.push(cloneDeep(fullDisk));
          }
          poolManagerTopology[value].vdevs.push(vdevDisks);
        }
      }
      const firstDisk = cloneDeep(allCategoryVdevsDisks[0]);
      poolManagerTopology[value].hasCustomDiskSelection = poolManagerTopology[value].hasCustomDiskSelection
      || allCategoryVdevsDisks.some((disk) => disk.size !== firstDisk.size || disk.type !== firstDisk.type);
      if (!poolManagerTopology[value].hasCustomDiskSelection) {
        poolManagerTopology[value].diskSize = firstDisk.size;
        poolManagerTopology[value].diskType = firstDisk.type;
        poolManagerTopology[value].vdevsNumber = topology[value].length;
      }
    }
    return poolManagerTopology;
  }
}
