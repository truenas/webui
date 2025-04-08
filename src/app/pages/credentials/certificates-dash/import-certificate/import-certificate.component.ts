import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal,
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
import { Certificate, CertificateCreate } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
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
  standalone: true,
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
    IxSelectComponent,
    IxTextareaComponent,
    IxFieldsetComponent,
  ],
})
export class ImportCertificateComponent implements OnInit {
  protected form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      this.validators.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCertificates.add.name.errors),
      ),
    ]],
    add_to_trusted_store: [false],
    csrExistsOnSystem: [false],
    csr: [null as number | null],
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

  protected csrs: Certificate[] = [];
  protected csrOptions$ = of<Option[]>([]);
  protected readonly requiredRoles = [Role.CertificateWrite];
  protected readonly helptext = helptextSystemCertificates;

  isLoading = signal(false);

  constructor(
    private api: ApiService,
    private formBuilder: NonNullableFormBuilder,
    private translate: TranslateService,
    private validators: IxValidatorsService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<void, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(Boolean(this.form?.dirty));
    });
  }

  get csrExists(): boolean {
    return this.form.controls.csrExistsOnSystem.value;
  }

  get selectedCsr(): Certificate | null {
    return this.csrs.find((csr) => csr.id === this.form.controls.csr.value) || null;
  }

  ngOnInit(): void {
    this.loadCsrs();
    this.setFieldValidators();
  }

  private loadCsrs(): void {
    this.api.call('certificate.query', [[['CSR', '!=', null]]])
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
      .subscribe((csrs) => {
        this.csrs = csrs;
        this.csrOptions$ = of(
          csrs.map((csr) => ({
            label: csr.name,
            value: csr.id,
          })),
        );
        this.cdr.markForCheck();
      });
  }

  private setFieldValidators(): void {
    this.form.controls.csrExistsOnSystem.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((csrExists) => {
        if (csrExists) {
          this.form.controls.privatekey.setValidators(null);
          this.form.controls.csr.setValidators([Validators.required]);
        } else {
          this.form.controls.certificate.setValidators([Validators.required]);
          this.form.controls.csr.setValidators(null);
        }

        this.form.controls.privatekey.updateValueAndValidity();
        this.form.controls.csr.updateValueAndValidity();
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
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private getPayload(): CertificateCreate {
    const payload = {
      ...omit(this.form.getRawValue(), ['csrExistsOnSystem', 'csr', 'passphrase2']),
      create_type: CertificateCreateType.Import,
    };

    if (this.csrExists && this.selectedCsr) {
      payload.certificate = this.selectedCsr.certificate;
      payload.privatekey = this.selectedCsr.privatekey;
    } else {
      payload.privatekey = this.form.controls.privatekey.value;
    }

    payload.passphrase = this.form.controls.passphrase.value || null;

    return payload;
  }
}
