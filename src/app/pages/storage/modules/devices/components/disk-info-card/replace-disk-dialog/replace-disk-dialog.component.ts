import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ReplaceDiskDialogData {
  diskName: string;
  guid: string;
  poolId: number;
}

@UntilDestroy()
@Component({
  selector: 'ix-replace-disk-dialog',
  templateUrl: './replace-disk-dialog.component.html',
  styleUrls: ['./replace-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceDiskDialogComponent {
  form = this.formBuilder.group({
    replacement: ['', Validators.required],
    force: [false],
  });

  readonly helptext = helptextVolumeStatus;

  protected readonly Role = Role;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<ReplaceDiskDialogComponent>,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: ReplaceDiskDialogData,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  onSubmit(): void {
    this.dialogService.jobDialog(
      this.ws.job('pool.replace', [this.data.poolId, {
        label: this.data.guid,
        disk: this.form.value.replacement,
        force: this.form.value.force,
      }]),
      { title: helptextVolumeStatus.replace_disk.title },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
        this.snackbar.success(
          this.translate.instant('Successfully replaced disk {disk}.', { disk: this.data.diskName }),
        );
      });
  }
}
