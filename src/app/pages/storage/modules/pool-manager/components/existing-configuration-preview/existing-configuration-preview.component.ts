import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash-es';
import {
  CreateVdevLayout, TopologyItemType, VdevType, vdevTypeLabels,
} from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
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
      data: _.cloneDeep(defaultCategory),
      log: _.cloneDeep(defaultCategory),
      spare: _.cloneDeep(defaultCategory),
      cache: _.cloneDeep(defaultCategory),
      dedup: _.cloneDeep(defaultCategory),
      special: _.cloneDeep(defaultCategory),
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
          allCategoryVdevsDisks.push(_.cloneDeep(vdevDisk));
          poolManagerTopology[value].vdevs.push([_.cloneDeep(vdevDisk)]);
        } else {
          const vdevDisks = [];
          for (const vdevDisk of vdev.children) {
            const fullDisk = this.disks.find((disk) => disk.devname === vdevDisk.disk);
            allCategoryVdevsDisks.push(_.cloneDeep(fullDisk));
            vdevDisks.push(_.cloneDeep(fullDisk));
          }
          poolManagerTopology[value].vdevs.push(vdevDisks);
        }
      }
      const firstDisk = _.cloneDeep(allCategoryVdevsDisks[0]);
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
