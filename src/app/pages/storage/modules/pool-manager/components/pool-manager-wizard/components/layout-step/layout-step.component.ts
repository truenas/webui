import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { filter } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualDiskSelectionComponent, ManualDiskSelectionParams,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import {
  PoolManagerStore,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { topologyCategoryToDisks } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@UntilDestroy()
@Component({
  selector: 'ix-layout-step',
  templateUrl: './layout-step.component.html',
  styleUrls: ['./layout-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutStepComponent implements OnInit {
  @Input() isStepActive: boolean;
  @Input() type: VdevType;
  @Input() description: string;

  @Input() canChangeLayout = false;
  @Input() limitLayouts: CreateVdevLayout[];

  @Input() inventory: UnusedDisk[];

  protected topologyCategory: PoolManagerTopologyCategory;
  private enclosures: Enclosure[] = [];

  get isSpareVdev(): boolean {
    return this.type === VdevType.Spare;
  }

  constructor(
    private store: PoolManagerStore,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.connectToStore();
  }

  openManualDiskSelection(): void {
    // TODO: Unify/rename?
    // Manual selection dialog uses inventory in a different way.
    const usedDisks = topologyCategoryToDisks(this.topologyCategory);
    const inventory = _.differenceBy(this.inventory, usedDisks, (disk) => disk.devname);

    this.dialog.open(ManualDiskSelectionComponent, {
      data: {
        inventory,
        enclosures: this.enclosures,
        layout: this.topologyCategory?.layout,
        vdevs: this.topologyCategory?.vdevs,
        vdevsLimit: this.isSpareVdev ? 1 : null,
      } as ManualDiskSelectionParams,
      panelClass: 'manual-selection-dialog',
    })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe((customVdevs: UnusedDisk[][]) => {
        if (!customVdevs.length) {
          this.store.resetTopologyCategory(this.type);
        } else {
          this.store.setManualTopologyCategory(this.type, customVdevs);
        }
      });
  }

  private connectToStore(): void {
    this.store.state$.pipe(untilDestroyed(this)).subscribe(({ topology, enclosures }) => {
      this.topologyCategory = topology[this.type];
      this.enclosures = enclosures;
      this.cdr.markForCheck();
    });
  }
}
