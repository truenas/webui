import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, input, inject,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnFormListComponent,
  TnFormListItemComponent,
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
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ignoreTranslation, TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-certificate-acme-add',
  templateUrl: './certificate-acme-add.component.html',
  styleUrls: ['./certificate-acme-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnFormListComponent,
    TnFormListItemComponent,
    TranslateModule,
  ],
})
export class CertificateAcmeAddComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private validatorsService = inject(IxValidatorsService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);

  protected readonly requiredRoles = [Role.CertificateWrite];

  protected form = this.formBuilder.nonNullable.group({
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

  protected domains: TranslatedString[] = [];

  /**
   * CSR to create the ACME certificate from, supplied by the `<tn-side-panel>` host. Required:
   * the payload below is meaningless without it, and `csr_id: undefined` would be dropped by
   * JSON serialisation and rejected by middleware rather than failing here.
   */
  readonly csr = input.required<Certificate>();

  protected readonly acmeDirectoryUris$ = this.api.call('certificate.acme_server_choices').pipe(choicesToOptions());
  protected readonly authenticators$ = this.api.call('acme.dns.authenticator.query').pipe(idNameArrayToOptions());

  protected readonly helptext = helptextSystemCertificates;

  protected readonly InputType = InputType;

  ngOnInit(): void {
    this.loadDomains(this.csr());
  }

  protected handleSubmit = (): SubmitResult => {
    const formValues = this.form.getRawValue();

    const dnsMapping = this.domains.reduce((mapping, domain, i) => {
      return {
        ...mapping,
        [domain]: formValues.domains[i],
      };
    }, {} as Record<string, string>);

    const payload = {
      name: formValues.name,
      csr_id: this.csr().id,
      tos: formValues.tos,
      create_type: CertificateCreateType.CreateAcme,
      renew_days: formValues.renew_days,
      acme_directory_uri: formValues.acme_directory_uri,
      dns_mapping: dnsMapping,
    };

    return {
      request$: this.dialogService.jobDialog(
        this.api.job('certificate.create', [payload]),
        {
          title: this.translate.instant('Creating ACME Certificate'),
        },
      ).afterClosed(),
      successMessage: this.translate.instant('ACME Certificate Created'),
    };
  };

  private loadDomains(csr: Certificate): void {
    this.loadFormConfig(
      this.api.call('webui.crypto.get_certificate_domain_names', [csr.id]),
      (domains) => {
        // `loadFormConfig` replays `patch` on retry, so rebuild the array rather than
        // appending to whatever a previous attempt left behind.
        this.form.controls.domains.clear();
        this.domains = domains.map(ignoreTranslation);
        domains.forEach((domain) => this.addDomainControls(domain));
      },
    );
  }

  private addDomainControls(domain: string): void {
    this.form.controls.domains.push(
      this.formBuilder.control(domain, Validators.required),
    );
  }
}
