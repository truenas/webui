import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk, TopologyDisk } from 'app/interfaces/storage.interface';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import {
  ReplaceDiskDialogComponent,
  ReplaceDiskDialogData,
} from 'app/pages/storage/modules/disks/components/replace-disk-dialog/replace-disk-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-info-card',
  templateUrl: './disk-info-card.component.html',
  styleUrls: ['./disk-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskInfoCardComponent {
  @Input() topologyDisk: TopologyDisk;
  @Input() disk: Disk;

  constructor(
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
  ) {}

  get isHdd(): boolean {
    return this.disk?.type === DiskType.Hdd;
  }

  get isAvailable(): boolean {
    return !!this.disk;
  }

  onEdit(): void {
    const slideInRef = this.slideInService.open(DiskFormComponent, { wide: true });
    slideInRef.componentInstance.setFormDisk(this.disk);
    slideInRef.slideInClosed$.pipe(
      filter((response) => Boolean(response)),
      untilDestroyed(this),
    ).subscribe(() => this.devicesStore.reloadList());
  }

  onReplace(): void {
    const poolId = this.route.snapshot.params.poolId as string;
    this.matDialog
      .open(ReplaceDiskDialogComponent, {
        data: {
          poolId: Number(poolId),
          guid: this.topologyDisk.guid,
          diskName: this.disk?.name || this.topologyDisk.guid,
        } as ReplaceDiskDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.devicesStore.reloadList();
      });
  }
}
