import { ChangeDetectionStrategy, Component, DestroyRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { omit } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateCreate } from 'app/interfaces/certificate.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { normalizeCertificateNewlines } from 'app/pages/credentials/certificates-dash/utils/normalize-certificate.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-certificate-add',
  templateUrl: './import-certificate.component.html',
  styleUrls: ['./import-certificate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnButtonComponent,
  ],
})
export class ImportCertificateComponent extends SidePanelForm {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private validators = inject(IxValidatorsService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      this.validators.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCertificates.add.name.errors),
      ),
    ]],
    add_to_trusted_store: [false],
    certificate: [''],
    privatekey: [''],
    passphrase: [''],
    passphrase2: [''],
  }, {
    validators: [
      matchOthersFgValidator(
        'passphrase',
        ['passphrase2'],
        this.translate.instant('Passphrase value must match Confirm Passphrase'),
      ),
    ],
  });

  protected readonly requiredRoles = [Role.CertificateWrite];
  protected readonly helptext = helptextSystemCertificates;
  protected readonly InputType = InputType;

  isLoading = signal(false);

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  protected onSubmit(): void {
    this.isLoading.set(true);

    const payload = this.getPayload();

    this.api.job('certificate.create', [payload])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => {
          this.isLoading.set(false);
          this.snackbar.success(this.translate.instant('Certificate has been created.'));
          this.close(true);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private getPayload(): CertificateCreate {
    const values = this.form.getRawValue();

    return {
      ...omit(values, ['passphrase2']),
      create_type: CertificateCreateType.Import,
      certificate: normalizeCertificateNewlines(values.certificate) || '',
      privatekey: normalizeCertificateNewlines(values.privatekey) || null,
      passphrase: values.passphrase || null,
    };
  }
}
