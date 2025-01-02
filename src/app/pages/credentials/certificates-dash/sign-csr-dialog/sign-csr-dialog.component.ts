import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { CertificateAuthoritySignRequest } from 'app/interfaces/certificate-authority.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-sign-csr-dialog',
  templateUrl: './sign-csr-dialog.component.html',
  styleUrls: ['./sign-csr-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class SignCsrDialogComponent {
  form = this.formBuilder.group({
    csr_cert_id: [null as number | null, Validators.required],
    name: ['', Validators.required],
  });

  csrs$ = this.systemGeneralService.getUnsignedCertificates().pipe(idNameArrayToOptions());

  readonly helptext = helptextSystemCa;

  protected readonly Role = Role;

  constructor(
    private dialogRef: MatDialogRef<SignCsrDialogComponent>,
    private systemGeneralService: SystemGeneralService,
    private formBuilder: FormBuilder,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: FormErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) private caId: number,
  ) {}

  onSubmit(): void {
    const params = {
      ...this.form.value,
      ca_id: this.caId,
    };

    this.api.call('certificateauthority.ca_sign_csr', [params as CertificateAuthoritySignRequest])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Certificate request signed'));
          this.dialogRef.close(true);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
