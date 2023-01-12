import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { of } from 'rxjs';
import { choicesToOptions } from 'app/helpers/options.helper';
import { translateOptions } from 'app/helpers/translate.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateExtensions } from 'app/interfaces/certificate-authority.interface';
import { CertificateExtension } from 'app/interfaces/certificate.interface';
import { SummaryItem, SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import {
  extensionsToSelectValues,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/extensions-to-select-values.utils';
import {
  authorityKeyIdentifierOptions,
  basicConstraintOptions,
  keyUsageOptions,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/extensions.constant';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-constraints',
  templateUrl: './certificate-constraints.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateConstraintsComponent implements OnInit, SummaryProvider {
  form = this.formBuilder.group({
    BasicConstraints: this.formBuilder.group({
      enabled: [false],
      path_length: [null as number],
      BasicConstraints: [[] as string[]],
    }),
    AuthorityKeyIdentifier: this.formBuilder.group({
      enabled: [false],
      AuthorityKeyIdentifier: [[] as string[]],
    }),
    ExtendedKeyUsage: this.formBuilder.group({
      enabled: [false],
      usages: [[] as string[]],
      extension_critical: [false],
    }),
    KeyUsage: this.formBuilder.group({
      enabled: [false],
      KeyUsage: [[] as string[]],
    }),
  });

  readonly helptext = helptextSystemCertificates;

  readonly basicConstraintsOptions$ = of(translateOptions(this.translate, basicConstraintOptions));
  readonly authorityKeyIdentifierOptions$ = of(translateOptions(this.translate, authorityKeyIdentifierOptions));
  readonly extendedKeyUsageOptions$ = this.ws.call('certificate.extended_key_usage_choices')
    .pipe(choicesToOptions());

  readonly keyUsageOptions$ = of(translateOptions(this.translate, keyUsageOptions));

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.updateUsagesValidator();
  }

  hasExtension(extension: CertificateExtension): boolean {
    return this.form.value[extension].enabled;
  }

  getSummary(): SummarySection {
    return [
      ...this.getBasicConstraintsSummary(),
      ...this.getAuthorityKeyIdentifierSummary(),
      ...this.getExtendedKeyUsageSummary(),
      ...this.getKeyUsageSummary(),
    ];
  }

  setFromProfile(extensions: CertificateExtensions): void {
    const {
      BasicConstraints: basicConstraints,
      AuthorityKeyIdentifier: authorityKeyIdentifier,
      ExtendedKeyUsage: extendedKeyUsage,
      KeyUsage: keyUsage,
    } = extensions;

    this.form.patchValue({
      BasicConstraints: {
        enabled: basicConstraints.enabled,
        path_length: basicConstraints.path_length || null,
        BasicConstraints: extensionsToSelectValues(_.omit(basicConstraints, ['enabled', 'path_length'])),
      },
      AuthorityKeyIdentifier: {
        enabled: authorityKeyIdentifier.enabled,
        AuthorityKeyIdentifier: extensionsToSelectValues(_.omit(authorityKeyIdentifier, ['enabled'])),
      },
      ExtendedKeyUsage: {
        enabled: extendedKeyUsage.enabled,
        extension_critical: extendedKeyUsage.extension_critical,
        usages: extendedKeyUsage.usages,
      },
      KeyUsage: {
        enabled: keyUsage.enabled,
        KeyUsage: extensionsToSelectValues(_.omit(keyUsage, ['enabled'])),
      },
    });
  }

  private updateUsagesValidator(): void {
    this.form.controls.ExtendedKeyUsage.controls.enabled.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((wasEnabled) => {
        const usages = this.form.controls.ExtendedKeyUsage.controls.usages;

        if (wasEnabled) {
          usages.setValidators([Validators.required]);
        } else {
          usages.clearValidators();
        }

        usages.updateValueAndValidity();
      });
  }

  private getBasicConstraintsSummary(): SummaryItem[] {
    if (!this.hasExtension('BasicConstraints')) {
      return;
    }

    const summary = [
      {
        label: this.translate.instant('Basic Constraints'),
        value: this.form.value.BasicConstraints.BasicConstraints.join(', '),
      },
    ];

    if (this.form.value.BasicConstraints.path_length) {
      summary.push({
        label: this.translate.instant('Path Length'),
        value: String(this.form.value.BasicConstraints.path_length),
      });
    }

    return summary;
  }

  private getAuthorityKeyIdentifierSummary(): SummaryItem[] {
    if (!this.hasExtension('AuthorityKeyIdentifier')) {
      return;
    }

    return [
      {
        label: this.translate.instant('Authority Key Identifier'),
        value: this.form.value.AuthorityKeyIdentifier.AuthorityKeyIdentifier.join(', '),
      },
    ];
  }

  private getExtendedKeyUsageSummary(): SummaryItem[] {
    if (!this.hasExtension('ExtendedKeyUsage')) {
      return;
    }

    const summary = [
      {
        label: this.translate.instant('Extended Key Usage'),
        value: this.form.value.ExtendedKeyUsage.usages.join(', '),
      },
    ];

    if (this.form.value.ExtendedKeyUsage.extension_critical) {
      summary.push({
        label: this.translate.instant('Critical Extension'),
        value: this.translate.instant('Yes'),
      });
    }

    return summary;
  }

  private getKeyUsageSummary(): SummaryItem[] {
    if (!this.hasExtension('KeyUsage')) {
      return;
    }

    return [
      {
        label: this.translate.instant('Key Usage'),
        value: this.form.value.KeyUsage.KeyUsage.join(', '),
      },
    ];
  }
}
