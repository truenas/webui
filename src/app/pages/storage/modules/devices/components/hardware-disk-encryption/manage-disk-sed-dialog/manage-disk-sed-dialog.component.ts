import {
  Component, OnInit, ChangeDetectionStrategy, Inject,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './manage-disk-sed-dialog.component.html',
  styleUrls: ['./manage-disk-sed-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageDiskSedDialogComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

  passwordControl = new FormControl('', [Validators.required]);

  disk: Disk;

  readonly helptext = helptextDisks;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
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
    this.ws.call('disk.query', [[['devname', '=', this.diskName]], { extra: { passwords: true } }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((disks) => {
        this.disk = disks[0];
        this.passwordControl.setValue(this.disk.passwd);
      });
  }

  setNewPassword(password: string): void {
    this.ws.call('disk.update', [this.disk.identifier, { passwd: password }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
        this.snackbar.success(this.translate.instant('SED password updated.'));
      });
  }
}
