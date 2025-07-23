import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { helptextActiveDirectory } from 'app/helptext/directory-service/active-directory';
import { DirectoryServicesLeaveParams } from 'app/interfaces/directoryservices-leave.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-leave-domain-dialog',
  templateUrl: './leave-domain-dialog.component.html',
  styleUrls: ['./leave-domain-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class LeaveDomainDialog {
  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly Role = Role;

  constructor(
    private errorHandler: ErrorHandlerService,
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private api: ApiService,
    private dialogRef: MatDialogRef<LeaveDomainDialog>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  onSubmit(): void {
    const formValue = this.form.value;
    // Always use KERBEROS_USER for leave operation
    const params: DirectoryServicesLeaveParams = {
      credential: {
        credential_type: DirectoryServiceCredentialType.KerberosUser,
        username: formValue.username ?? '',
        password: formValue.password ?? '',
      },
    };

    // Show job progress dialog
    this.dialogService.jobDialog(
      this.api.job('directoryservices.leave', [params]),
      {
        title: this.translate.instant('Leaving Domain'),
        description: this.translate.instant('Leaving domain, please wait...'),
      },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          // Job completed successfully
          this.snackbar.success(
            this.translate.instant(helptextActiveDirectory.domainLeftMessage),
          );
          this.dialogRef.close(true);
        },
        error: (error: unknown) => {
          // Job failed - show error and keep dialog open
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
