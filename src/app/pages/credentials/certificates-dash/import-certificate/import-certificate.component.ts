import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { omit } from 'lodash-es';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateCreate } from 'app/interfaces/certificate.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-add',
  templateUrl: './import-certificate.component.html',
  styleUrls: ['./import-certificate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
    FormsModule,
    IxCheckboxComponent,
    IxInputComponent,
    ReactiveFormsModule,
    IxTextareaComponent,
    IxFieldsetComponent,
  ],
})
export class ImportCertificateComponent {
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

  isLoading = signal(false);

  constructor(
    private api: ApiService,
    private formBuilder: NonNullableFormBuilder,
    private translate: TranslateService,
    private validators: IxValidatorsService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<void, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(Boolean(this.form?.dirty));
    });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const payload = this.getPayload();

    this.api.job('certificate.create', [payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading.set(false);
          this.snackbar.success(this.translate.instant('Certificate has been created.'));
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private getPayload(): CertificateCreate {
    return {
      ...omit(this.form.getRawValue(), ['passphrase2']),
      create_type: CertificateCreateType.Import,
      passphrase: this.form.controls.passphrase.value || null,
      privatekey: this.form.controls.privatekey.value || undefined,
    };
  }
}
