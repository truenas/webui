import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { CertificateAuthoritySignRequest } from 'app/interfaces/certificate-authority.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  AppLoaderService, SystemGeneralService, WebSocketService,
} from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './sign-csr-dialog.component.html',
  styleUrls: ['./sign-csr-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignCsrDialogComponent {
  form = this.formBuilder.group({
    csr_cert_id: [null as number, Validators.required],
    name: ['', Validators.required],
  });

  csrs$ = this.systemGeneralService.getUnsignedCertificates().pipe(idNameArrayToOptions());

  readonly helptext = helptextSystemCa;

  constructor(
    private dialogRef: MatDialogRef<SignCsrDialogComponent>,
    private systemGeneralService: SystemGeneralService,
    private formBuilder: FormBuilder,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) private caId: number,
  ) {}

  onSubmit(): void {
    this.loader.open();
    const params = {
      ...this.form.value,
      ca_id: this.caId,
    };

    this.ws.call('certificateauthority.ca_sign_csr', [params as CertificateAuthoritySignRequest])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close();
        },
        error: (error) => {
          this.loader.close();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
