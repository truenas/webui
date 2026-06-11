import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { helptextActiveDirectory } from 'app/helptext/directory-service/active-directory';
import { DirectoryServicesLeaveParams } from 'app/interfaces/directoryservices-leave.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-leave-domain-dialog',
  templateUrl: './leave-domain-dialog.component.html',
  styleUrls: ['./leave-domain-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class LeaveDomainDialog {
  private errorHandler = inject(ErrorHandlerService);
  private formBuilder = inject(FormBuilder);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  protected dialogRef = inject<DialogRef<unknown, LeaveDomainDialog>>(DialogRef);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly Role = Role;

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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
