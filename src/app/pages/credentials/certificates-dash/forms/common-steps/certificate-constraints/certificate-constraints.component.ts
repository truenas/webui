import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { choicesToOptions } from 'app/helpers/options.helper';
import { translateOptions } from 'app/helpers/translate.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateExtension } from 'app/interfaces/certificate.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';

@Component({
  selector: 'ix-certificate-constraints',
  templateUrl: './certificate-constraints.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateConstraintsComponent {
  form = this.formBuilder.group({
    BasicConstraints: this.formBuilder.group({
      enabled: [false],
      path_length: [null as number],
      BasicConstraints: [[] as string[]],
    }),
    AuthorityKeyIdentifier: this.formBuilder.group({
      enabled: [false],
      AuthorityKeyIdentifier: [[] as string[]], // TODO: Weird
    }),
    ExtendedKeyUsage: this.formBuilder.group({
      enabled: [false],
      usages: [
        [] as string[],
        this.validators.validateOnCondition(
          (control) => control?.parent?.value.enabled,
          Validators.required,
        ),
      ],
      extension_critical: [false],
    }),
    KeyUsage: this.formBuilder.group({
      enabled: [false],
      KeyUsage: [[] as string[]], // TODO: Weird
    }),
  });

  readonly helptext = helptextSystemCertificates;

  readonly basicConstraintsOptions$ = of(translateOptions(this.translate, [
    {
      value: 'ca',
      label: helptextSystemCertificates.add.basic_constraints.ca.placeholder,
      tooltip: helptextSystemCertificates.add.basic_constraints.ca.tooltip,
    },
    {
      value: 'extension_critical',
      label: helptextSystemCertificates.add.basic_constraints.extension_critical.placeholder,
      tooltip: helptextSystemCertificates.add.basic_constraints.extension_critical.tooltip,
    },
  ]));

  readonly authorityKeyIdentifierOptions$ = of(translateOptions(this.translate, [
    {
      value: 'authority_cert_issuer',
      label: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.placeholder,
      tooltip: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.tooltip,
    },
    {
      value: 'extension_critical',
      label: helptextSystemCertificates.add.authority_key_identifier.extension_critical.placeholder,
      tooltip: helptextSystemCertificates.add.authority_key_identifier.extension_critical.tooltip,
    },
  ]));

  readonly extendedKeyUsageOptions$ = this.ws.call('certificate.extended_key_usage_choices')
    .pipe(choicesToOptions());

  readonly keyUsageOptions$ = of(translateOptions(this.translate, [

    {
      value: 'digital_signature',
      label: helptextSystemCertificates.add.key_usage.digital_signature.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.digital_signature.tooltip,
    },
    {
      value: 'content_commitment',
      label: helptextSystemCertificates.add.key_usage.content_commitment.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.content_commitment.tooltip,
    },
    {
      value: 'key_encipherment',
      label: helptextSystemCertificates.add.key_usage.key_encipherment.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.key_encipherment.tooltip,
    },
    {
      value: 'data_encipherment',
      label: helptextSystemCertificates.add.key_usage.data_encipherment.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.data_encipherment.tooltip,
    },
    {
      value: 'key_agreement',
      label: helptextSystemCertificates.add.key_usage.key_agreement.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.key_agreement.tooltip,
    },
    {
      value: 'key_cert_sign',
      label: helptextSystemCertificates.add.key_usage.key_cert_sign.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.key_cert_sign.tooltip,
    },
    {
      value: 'crl_sign',
      label: helptextSystemCertificates.add.key_usage.crl_sign.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.crl_sign.tooltip,
    },
    {
      value: 'encipher_only',
      label: helptextSystemCertificates.add.key_usage.encipher_only.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.encipher_only.tooltip,
    },
    {
      value: 'decipher_only',
      label: helptextSystemCertificates.add.key_usage.decipher_only.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.decipher_only.tooltip,
    },
    {
      value: 'extension_critical',
      label: helptextSystemCertificates.add.key_usage.extension_critical.placeholder,
      tooltip: helptextSystemCertificates.add.key_usage.extension_critical.tooltip,
    },
  ]));

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private validators: IxValidatorsService,
  ) {}

  hasExtension(extension: CertificateExtension): boolean {
    return this.form.get(extension)?.value.enabled;
  }
}
