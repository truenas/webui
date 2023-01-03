import {
  Component, OnInit, ChangeDetectionStrategy, Inject,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/storage/disks/disks';
import { Disk } from 'app/interfaces/storage.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './manage-disk-sed-dialog.component.html',
  styleUrls: ['./manage-disk-sed-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageDiskSedDialogComponent implements OnInit {
  passwordControl = new FormControl('', [Validators.required]);

  disk: Disk;

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<ManageDiskSedDialogComponent>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private diskName: string,
  ) { }

  ngOnInit(): void {
    this.loadDiskSedInfo();
  }

  onClearPassword(): void {
    this.setNewPassword('');
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.setNewPassword(this.passwordControl.value);
  }

  private loadDiskSedInfo(): void {
    this.loader.open();

    this.ws.call('disk.query', [[['devname', '=', this.diskName]], { extra: { passwords: true } }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (disks) => {
          this.loader.close();
          this.disk = disks[0];
          this.passwordControl.setValue(this.disk.passwd);
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
  }

  setNewPassword(password: string): void {
    this.loader.open();
    this.ws.call('disk.update', [this.disk.identifier, { passwd: password }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close(true);
          this.snackbar.success(this.translate.instant('SED password updated.'));
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
  }
}
