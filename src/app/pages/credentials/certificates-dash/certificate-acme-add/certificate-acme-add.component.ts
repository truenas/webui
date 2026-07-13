import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, input, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions, idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation, TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-certificate-acme-add',
  templateUrl: './certificate-acme-add.component.html',
  styleUrls: ['./certificate-acme-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    IxListComponent,
    IxListItemComponent,
    TranslateModule,
  ],
})
export class CertificateAcmeAddComponent extends SidePanelForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private validatorsService = inject(IxValidatorsService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.CertificateWrite];

  form = this.formBuilder.nonNullable.group({
    name: ['', [
      Validators.required,
      this.validatorsService.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCertificates.add.name.errors),
      ),
    ]],
    tos: [false, Validators.requiredTrue],
    renew_days: [10, [Validators.required, Validators.min(0)]],
    acme_directory_uri: ['', Validators.required],
    custom_acme_directory_uri: [false],
    domains: this.formBuilder.array<string>([]),
  });

  protected isLoading = signal(false);

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  domains: TranslatedString[] = [];

  /** CSR to create the ACME certificate from, supplied by the `<tn-side-panel>` host. */
  readonly csr = input<Certificate | undefined>(undefined);

  private csrData: Certificate | undefined;

  readonly acmeDirectoryUris$ = this.api.call('certificate.acme_server_choices').pipe(choicesToOptions());
  readonly authenticators$ = this.api.call('acme.dns.authenticator.query').pipe(idNameArrayToOptions());

  readonly helptext = helptextSystemCertificates;

  protected readonly InputType = InputType;

  ngOnInit(): void {
    this.csrData = this.csr();
    if (this.csrData) {
      this.loadDomains();
    }
  }

  protected onSubmit(): void {
    // The form is only ever opened with a CSR (the panel supplies it via the `csr` input);
    // guard the invariant explicitly rather than rely on non-strict null checks.
    if (!this.csrData) {
      return;
    }

    const formValues = this.form.getRawValue();

    const dnsMapping = this.domains.reduce((mapping, domain, i) => {
      return {
        ...mapping,
        [domain]: formValues.domains[i],
      };
    }, {} as Record<string, string>);

    const payload = {
      name: formValues.name,
      csr_id: this.csrData.id,
      tos: formValues.tos,
      create_type: CertificateCreateType.CreateAcme,
      renew_days: formValues.renew_days,
      acme_directory_uri: formValues.acme_directory_uri,
      dns_mapping: dnsMapping,
    };

    this.isLoading.set(true);

    this.dialogService.jobDialog(
      this.api.job('certificate.create', [payload]),
      {
        title: this.translate.instant('Creating ACME Certificate'),
      },
    )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.close(true);
          this.snackbar.success(this.translate.instant('ACME Certificate Created'));
        },
        complete: () => {
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.isLoading.set(false);
        },
      });
  }

  private loadDomains(): void {
    this.isLoading.set(true);

    this.api.call('webui.crypto.get_certificate_domain_names', [this.csrData.id])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (domains) => {
          const normalizedDomains = domains.map((domain) => this.normalizeDomain(domain));
          this.domains = normalizedDomains.map(ignoreTranslation);
          normalizedDomains.forEach((domain) => this.addDomainControls(domain));
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  /**
   * The backend returns SAN entries prefixed with their type (e.g. `DNS:truenas.com`).
   * Strip the `DNS:` prefix so the rendered value and the resulting `dns_mapping` keys
   * contain the raw domain name, otherwise the payload fails backend validation with
   * "[EFAULT] ... Domain name needs at least one dot".
   */
  private normalizeDomain(domain: string): string {
    return domain.replace(/^DNS:/i, '').trim();
  }

  private addDomainControls(domain: string): void {
    this.form.controls.domains.push(
      this.formBuilder.control(domain, Validators.required),
    );
  }
}
