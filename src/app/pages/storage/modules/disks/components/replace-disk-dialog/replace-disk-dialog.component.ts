import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map, tap } from 'rxjs/operators';
import helptext from 'app/helptext/storage/volumes/volume-status';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';

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

  unusedDisks: UnusedDisk[] = [];

  unusedDisks$ = this.ws.call('disk.get_unused').pipe(
    tap((unusedDisks) => {
      this.unusedDisks = unusedDisks;
    }),
    map((disks) => disks.map((disk) => ({
      label: disk.devname,
      value: disk.identifier,
    }))),
  );

  readonly helptext = helptext;

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
    this.setupExportedZpoolWarningForUnusedDisks();
  }

  setupExportedZpoolWarningForUnusedDisks(): void {
    this.form.get('replacement').valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnAboutExportedPoolForUnusedDiskIfNeeded,
    );
  }

  warnAboutExportedPoolForUnusedDiskIfNeeded = (diskIdentifier: string): void => {
    const unusedDisk = this.findDiskFromUnusedDisks(diskIdentifier);
    if (unusedDisk?.exported_zpool) {
      this.showWarningAboutExportedZpoolForDisk(unusedDisk);
    }
  };

  findDiskFromUnusedDisks(diskIdentifier: string): UnusedDisk {
    return this.unusedDisks.find((unusedDisk) => unusedDisk.identifier === diskIdentifier);
  }

  showWarningAboutExportedZpoolForDisk(unusedDisk: Partial<UnusedDisk>): void {
    this.dialogService.warn(
      this.translate.instant('Warning'),
      this.translate.instant(
        'This disk is part of the exported zpool {zpool}. Wiping this disk will make {zpool} unable\
        to import. You will lose any and all data in {zpool}. Are you sure you want to use this disk?',
        { zpool: '\'' + unusedDisk.exported_zpool + '\'' },
      ),
    );
  }

  onSubmit(): void {
    const jobDialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.replace_disk.title },
      disableClose: true,
    });
    jobDialogRef.componentInstance.setDescription(helptext.replace_disk.description);
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
