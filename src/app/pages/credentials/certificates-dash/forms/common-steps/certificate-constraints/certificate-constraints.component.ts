import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateExtension } from 'app/interfaces/certificate.interface';

@Component({
  selector: 'ix-certificate-constraints',
  templateUrl: './certificate-constraints.component.html',
  styleUrls: ['./certificate-constraints.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateConstraintsComponent {
  form = this.formBuilder.group({
    BasicConstraints: this.formBuilder.group({
      enabled: [false],
      path_length: [null as number],
      BasicConstraints: [[] as string[]], // TODO: Weird
    }),
    AuthorityKeyIdentifier: this.formBuilder.group({
      enabled: [false],
      AuthorityKeyIdentifier: [[] as string[]], // TODO: Weird
    }),
    ExtendedKeyUsage: this.formBuilder.group({
      enabled: [false],
      usages: [[] as string[]],
      extension_critical: [false],
    }),
    KeyUsage: this.formBuilder.group({
      enabled: [false],
      KeyUsage: [[] as string[]], // TODO: Weird
    }),
  });

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
  ) {}

  hasExtension(extension: CertificateExtension): boolean {
    return this.form.get(extension)?.value.enabled;
  }
}
