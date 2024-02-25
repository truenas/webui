import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { Option } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ReplaceDiskDialogData {
  diskName: string;
  guid: string;
  poolId: number;
}

@UntilDestroy()
@Component({
  templateUrl: './replace-disk-dialog.component.html',
  styleUrls: ['./replace-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceDiskDialogComponent implements OnInit {
  form = this.formBuilder.group({
    replacement: ['', Validators.required],
    force: [false],
  });

  disksProvider = new SimpleAsyncComboboxProvider(this.loadUnusedDisks());
  unusedDisks: UnusedDisk[] = [];

  readonly helptext = helptextVolumeStatus;

  protected readonly Role = Role;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<ReplaceDiskDialogComponent>,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: ReplaceDiskDialogData,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.loadUnusedDisks();
    this.setupExportedPoolWarning();
  }

  loadUnusedDisks(): Observable<Option[]> {
    return this.ws.call('disk.get_unused').pipe(
      map((unusedDisks) => {
        this.unusedDisks = unusedDisks;
        return unusedDisks.map((disk) => {
          const exportedPool = disk.exported_zpool ? ` (${disk.exported_zpool})` : '';
          const size = buildNormalizedFileSize(disk.size);

          return {
            label: `${disk.devname} - ${size} ${exportedPool}`,
            value: disk.identifier,
          };
        }).sort((a, b) => a.label.localeCompare(b.label));
      }),
      untilDestroyed(this),
    );
  }

  setupExportedPoolWarning(): void {
    this.form.controls.replacement.valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnAboutExportedPool.bind(this),
    );
  }

  warnAboutExportedPool(diskIdentifier: string): void {
    const unusedDisk = this.unusedDisks.find((disk) => disk.identifier === diskIdentifier);
    if (!unusedDisk?.exported_zpool) {
      return;
    }
    this.dialogService.warn(
      this.translate.instant('Warning') + ': ' + unusedDisk.name,
      this.translate.instant(
        'This disk is part of the exported pool {pool}. Wiping this disk will make {pool} unable\
        to import. You will lose any and all data in {pool}. Please make sure that any sensitive data in {pool} is backed up before reusing/repurposing this disk.',
        { pool: `'${unusedDisk.exported_zpool}'` },
      ),
    );
  }

  onSubmit(): void {
    const jobDialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptextVolumeStatus.replace_disk.title },
      disableClose: true,
    });
    jobDialogRef.componentInstance.setDescription(helptextVolumeStatus.replace_disk.description);
    jobDialogRef.componentInstance.setCall('pool.replace', [this.data.poolId, {
      label: this.data.guid,
      disk: this.form.value.replacement,
      force: this.form.value.force,
    }]);
    jobDialogRef.componentInstance.submit();
    jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      jobDialogRef.close(true);
      this.dialogRef.close(true);
      this.snackbar.success(
        this.translate.instant('Successfully replaced disk {disk}.', { disk: this.data.diskName }),
      );
    });
  }
}
