import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { Option } from 'app/interfaces/option.interface';
import { PoolAttachParams } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ExtendDialogParams {
  poolId: number;
  targetVdevGuid: string;
}

@UntilDestroy()
@Component({
  templateUrl: './extend-dialog.component.html',
  styleUrls: ['./extend-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtendDialogComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    newDisk: ['', Validators.required],
  });

  readonly helptext = helptextVolumeStatus;

  disksProvider = new SimpleAsyncComboboxProvider(this.loadUnusedDisks());
  unusedDisks: UnusedDisk[] = [];
  private disksWithDuplicateSerials: UnusedDisk[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<ExtendDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExtendDialogParams,
  ) {}

  ngOnInit(): void {
    this.loadUnusedDisks();
    this.setupExportedPoolWarning();
  }

  setupExportedPoolWarning(): void {
    this.form.controls.newDisk.valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnAboutExportedPool.bind(this),
    );
  }

  warnAboutExportedPool(diskName: string): void {
    const unusedDisk = this.unusedDisks.find((disk) => disk.name === diskName);
    if (!unusedDisk?.exported_zpool) {
      return;
    }
    this.dialogService.warn(
      this.translate.instant('Warning') + ': ' + unusedDisk.name,
      this.translate.instant(helptextVolumeStatus.exported_pool_warning, { pool: `'${unusedDisk.exported_zpool}'` }),
    );
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    const payload = {
      new_disk: this.form.value.newDisk,
      target_vdev: this.data.targetVdevGuid,
    } as PoolAttachParams;

    const isDuplicateSerial = this.disksWithDuplicateSerials.some((disk) => disk.name === payload.new_disk);
    if (isDuplicateSerial) {
      payload.allow_duplicate_serials = true;
    }

    this.ws.job('pool.attach', [this.data.poolId, payload])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((job) => {
        if (job.state !== JobState.Success) {
          return;
        }

        this.snackbar.success(this.translate.instant('Vdev successfully extended.'));
        this.dialogRef.close(true);
      });
  }

  loadUnusedDisks(): Observable<Option[]> {
    return this.ws.call('disk.get_unused').pipe(
      map((unusedDisks) => {
        this.unusedDisks = unusedDisks;
        this.disksWithDuplicateSerials = unusedDisks.filter((disk) => disk.duplicate_serial.length);

        return unusedDisks.map((disk) => {
          const exportedPool = disk.exported_zpool ? ` (${disk.exported_zpool})` : '';

          return {
            label: `${disk.devname} (${buildNormalizedFileSize(disk.size)}) ${exportedPool}`,
            value: disk.name,
          };
        }).sort((a, b) => a.label.localeCompare(b.label));
      }),
      untilDestroyed(this),
    );
  }
}
