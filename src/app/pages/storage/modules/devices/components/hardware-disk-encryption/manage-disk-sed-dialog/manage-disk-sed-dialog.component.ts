import {
  Component, OnInit, ChangeDetectionStrategy, Inject,
} from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk } from 'app/interfaces/disk.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-manage-disk-sed-dialog',
  templateUrl: './manage-disk-sed-dialog.component.html',
  styleUrls: ['./manage-disk-sed-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
})
export class ManageDiskSedDialogComponent implements OnInit {
  protected readonly requiredRoles = [Role.DiskWrite];

  passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  disk: Disk;

  readonly helptext = helptextDisks;

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
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
    this.api.call('disk.query', [[['devname', '=', this.diskName]], { extra: { passwords: true } }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((disks) => {
        this.disk = disks[0];
        this.passwordControl.setValue(this.disk.passwd || '');
      });
  }

  setNewPassword(password: string): void {
    this.api.call('disk.update', [this.disk.identifier, { passwd: password }])
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
