import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { omit } from 'lodash-es';
import { filter, take } from 'rxjs/operators';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateCreate } from 'app/interfaces/certificate.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { normalizeCertificateNewlines } from 'app/pages/credentials/certificates-dash/utils/normalize-certificate.utils';

@Component({
  selector: 'ix-certificate-add',
  templateUrl: './import-certificate.component.html',
  styleUrls: ['./import-certificate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    FormsModule,
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
  ],
})
export class ImportCertificateComponent extends IxFormHostForm {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private validators = inject(IxValidatorsService);

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

  protected handleSubmit = (): SubmitResult => ({
    // `api.job` reports progress before it finishes; wait for the terminal Success state rather
    // than letting `<ix-form>`'s `take(1)` treat the queued job as a completed save.
    request$: this.api.job('certificate.create', [this.getPayload()]).pipe(
      filter((job) => job.state === JobState.Success),
      take(1),
    ),
    successMessage: this.translate.instant('Certificate has been created.'),
  });

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
