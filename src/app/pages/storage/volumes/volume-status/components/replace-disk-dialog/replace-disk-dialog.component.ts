import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/storage/volumes/volume-status';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services';

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
export class ReplaceDiskDialogComponent {
  form = this.formBuilder.group({
    replacement: ['', Validators.required],
    force: [false],
  });

  unusedDisks$ = this.ws.call('disk.get_unused').pipe(
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
  ) {}

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
