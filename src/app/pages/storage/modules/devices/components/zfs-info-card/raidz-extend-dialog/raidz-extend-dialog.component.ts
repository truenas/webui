import {
  ChangeDetectionStrategy, Component, computed, Inject, signal,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { Disk, DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolAttachParams } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface RaidzExtendDialogParams {
  poolId: number;
  vdev: VDev;
}

@UntilDestroy()
@Component({
  selector: 'ix-raidz-extend-dialog',
  templateUrl: './raidz-extend-dialog.component.html',
  styleUrls: ['./raidz-extend-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaidzExtendDialogComponent {
  form = this.formBuilder.group({
    newDisk: ['', Validators.required],
  });

  readonly helptext = helptextVolumeStatus;

  readonly minimumSize = signal<number>(0);
  readonly filterMinimumSizeFn = computed(() => {
    return (disk: DetailsDisk) => disk.size >= this.minimumSize();
  });

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<RaidzExtendDialogComponent>,
    private devicesStore: DevicesStore,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: RaidzExtendDialogParams,
  ) {
    this.setFilterMinimumSizeFn();
  }

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    const payload = {
      // UI check for duplicate serials is handled in UnusedDiskSelectComponent
      allow_duplicate_serials: true,
      new_disk: this.form.value.newDisk,
      target_vdev: this.data.vdev.guid,
    } as PoolAttachParams;

    this.dialogService.jobDialog(
      this.ws.job('pool.attach', [this.data.poolId, payload]),
      { title: this.translate.instant('Extending VDEV') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Vdev successfully extended.'));
        this.dialogRef.close(true);
      });
  }

  private setFilterMinimumSizeFn(): void {
    let diskDictionary: Record<string, Disk> = {};
    this.devicesStore.diskDictionary$
      .pipe(untilDestroyed(this))
      .subscribe((dictionary) => diskDictionary = dictionary);

    const minimumSize = this.data.vdev.children.reduce((acc, topologyDisk) => {
      const disk = diskDictionary[topologyDisk.disk];
      if (!disk) {
        return acc;
      }
      return disk.size < acc ? disk.size : acc;
    }, Number.MAX_SAFE_INTEGER);

    this.minimumSize.set(minimumSize);
  }
}
