import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { omit } from 'lodash-es';
import { of } from 'rxjs';
import { ExtendedKeyUsageFlag } from 'app/enums/extended-key-usage-flag.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { findLabelsByValue } from 'app/helpers/options.helper';
import { translateOptions } from 'app/helpers/translate.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import {
  AuthorityKeyIdentifiers,
  CertificateExtensions,
  KeyUsages,
} from 'app/interfaces/certificate-authority.interface';
import { CertificateCreate, CertificateExtension } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SummaryItem, SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  extensionsToSelectValues,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/extensions-to-select-values.utils';
import {
  AuthorityKeyIdentifier,
  authorityKeyIdentifierOptions, BasicConstraint,
  basicConstraintOptions,
  keyUsageOptions,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/extensions.constants';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-constraints',
  templateUrl: './certificate-constraints.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxInputComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
  ],
})
export class CertificateConstraintsComponent implements OnInit, SummaryProvider {
  hasAuthorityKeyIdentifier = input(false);

  form = this.formBuilder.group({
    BasicConstraints: this.formBuilder.group({
      enabled: [false],
      path_length: [null as number],
      BasicConstraints: [[] as BasicConstraint[]],
    }),
    AuthorityKeyIdentifier: this.formBuilder.group({
      enabled: [false],
      AuthorityKeyIdentifier: [[] as AuthorityKeyIdentifier[]],
    }),
    ExtendedKeyUsage: this.formBuilder.group({
      enabled: [false],
      usages: [[] as ExtendedKeyUsageFlag[]],
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
  readonly keyUsageOptions$ = of(translateOptions(this.translate, keyUsageOptions));
  extendedKeyUsageOptions$ = of<Option[]>([]);

  private extendedKeyUsageOptions: Option[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.updateUsagesValidator();
    this.loadKeyUsageOptions();
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

  getPayload(): Pick<CertificateCreate, 'cert_extensions'> {
    const {
      BasicConstraints: basicConstraints,
      AuthorityKeyIdentifier: authorityKeyIdentifier,
      ExtendedKeyUsage: extendedKeyUsage,
      KeyUsage: keyUsage,
    } = this.form.value;

    return {
      cert_extensions: {
        BasicConstraints: {
          enabled: basicConstraints.enabled,
          ca: basicConstraints.BasicConstraints.includes(BasicConstraint.Ca),
          extension_critical: basicConstraints.BasicConstraints.includes(BasicConstraint.ExtensionCritical),
          path_length: basicConstraints.path_length,
        },
        AuthorityKeyIdentifier: this.hasAuthorityKeyIdentifier()
          ? {
              enabled: authorityKeyIdentifier.enabled,
              authority_cert_issuer: authorityKeyIdentifier.AuthorityKeyIdentifier
                .includes(AuthorityKeyIdentifier.AuthorityCertIssuer),
              extension_critical: authorityKeyIdentifier.AuthorityKeyIdentifier
                .includes(AuthorityKeyIdentifier.ExtensionCritical),
            }
          : {} as AuthorityKeyIdentifiers,
        ExtendedKeyUsage: {
          enabled: extendedKeyUsage.enabled,
          extension_critical: extendedKeyUsage.extension_critical,
          usages: extendedKeyUsage.usages,
        },
        KeyUsage: {
          enabled: keyUsage.enabled,
          ...keyUsage.KeyUsage.reduce((acc, usage) => {
            return {
              ...acc,
              [usage]: true,
            };
          }, {} as KeyUsages),
        },
      },
    };
  }

  setFromProfile(extensions: CertificateExtensions): void {
    const {
      BasicConstraints: basicConstraints,
      AuthorityKeyIdentifier: authorityKeyIdentifier,
      ExtendedKeyUsage: extendedKeyUsage,
      KeyUsage: keyUsage,
    } = extensions;

    if (basicConstraints) {
      this.form.patchValue({
        BasicConstraints: {
          enabled: basicConstraints.enabled,
          path_length: basicConstraints.path_length || null,
          BasicConstraints: extensionsToSelectValues(
            omit(basicConstraints, ['enabled', 'path_length']),
          ) as BasicConstraint[],
        },
      });
    }
    if (authorityKeyIdentifier) {
      this.form.patchValue({
        AuthorityKeyIdentifier: {
          enabled: authorityKeyIdentifier.enabled,
          AuthorityKeyIdentifier: extensionsToSelectValues(
            omit(authorityKeyIdentifier, ['enabled']),
          ) as AuthorityKeyIdentifier[],
        },
      });
    }
    if (extendedKeyUsage) {
      this.form.patchValue({
        ExtendedKeyUsage: {
          enabled: extendedKeyUsage.enabled,
          extension_critical: extendedKeyUsage.extension_critical,
          usages: extendedKeyUsage.usages,
        },
      });
    }
    if (keyUsage) {
      this.form.patchValue({
        KeyUsage: {
          enabled: keyUsage.enabled,
          KeyUsage: extensionsToSelectValues(omit(keyUsage, ['enabled'])),
        },
      });
    }
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
      return [];
    }

    const summary = [
      {
        label: this.translate.instant('Basic Constraints'),
        value: this.form.value.BasicConstraints.BasicConstraints
          .map(findLabelsByValue(basicConstraintOptions))
          .join(', '),
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
    if (!this.hasExtension('AuthorityKeyIdentifier') || !this.hasAuthorityKeyIdentifier()) {
      return [];
    }

    return [
      {
        label: this.translate.instant('Authority Key Identifier'),
        value: this.form.value.AuthorityKeyIdentifier.AuthorityKeyIdentifier
          .map(findLabelsByValue(authorityKeyIdentifierOptions))
          .join(', '),
      },
    ];
  }

  private getExtendedKeyUsageSummary(): SummaryItem[] {
    if (!this.hasExtension('ExtendedKeyUsage')) {
      return [];
    }

    const summary = [
      {
        label: this.translate.instant('Extended Key Usage'),
        value: this.form.value.ExtendedKeyUsage.usages
          .map(findLabelsByValue(this.extendedKeyUsageOptions))
          .join(', '),
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
      return [];
    }

    return [
      {
        label: this.translate.instant('Key Usage'),
        value: this.form.value.KeyUsage.KeyUsage
          .map(findLabelsByValue(keyUsageOptions))
          .join(', '),
      },
    ];
  }

  private loadKeyUsageOptions(): void {
    this.ws.call('certificate.extended_key_usage_choices')
      .pipe(
        choicesToOptions(),
        untilDestroyed(this),
      )
      .subscribe((options) => {
        this.extendedKeyUsageOptions = options;
        this.extendedKeyUsageOptions$ = of(options);
        this.cdr.markForCheck();
      });
  }
}
