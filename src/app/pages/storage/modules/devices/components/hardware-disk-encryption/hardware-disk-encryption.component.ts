import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-hardware-disk-encryption',
  templateUrl: './hardware-disk-encryption.component.html',
  styleUrls: ['./hardware-disk-encryption.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HardwareDiskEncryptionComponent implements OnChanges {
  @Input() topologyDisk: TopologyDisk;

  hasGlobalEncryption$ = this.ws.call('system.advanced.sed_global_password').pipe(toLoadingState());
  hasDiskEncryption$: Observable<LoadingState<boolean>>;

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.loadDiskEncryption();
  }

  onManageSedPassword(): void {
    const dialog = this.matDialog.open(ManageDiskSedDialogComponent, {
      data: this.topologyDisk.disk,
    });
    dialog
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((wasChanged) => {
        if (!wasChanged) {
          return;
        }

        this.loadDiskEncryption();
        this.cdr.markForCheck();
      });
  }

  private loadDiskEncryption(): void {
    this.hasDiskEncryption$ = this.ws.call('disk.query', [[['devname', '=', this.topologyDisk.disk]], { extra: { passwords: true } }])
      .pipe(
        map((disks) => disks[0].passwd !== ''),
        toLoadingState(),
      );
  }
}
