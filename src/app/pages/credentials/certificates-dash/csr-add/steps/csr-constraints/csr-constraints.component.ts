import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import {
  CertificateCreate,
  CertificateExtension,
  CertificateExtensions,
  KeyUsages,
} from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SummaryItem, SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslateOptionsPipe } from 'app/modules/translate/translate-options/translate-options.pipe';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  extensionsToSelectValues,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-constraints/extensions-to-select-values.utils';
import {
  BasicConstraint,
  basicConstraintOptions,
  keyUsageOptions,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-constraints/extensions.constants';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-csr-constraints',
  templateUrl: './csr-constraints.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TranslateOptionsPipe,
  ],
})
export class CsrConstraintsComponent implements OnInit, SummaryProvider {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);

  form = this.formBuilder.nonNullable.group({
    BasicConstraints: this.formBuilder.nonNullable.group({
      enabled: [false],
      path_length: [null as number | null],
      BasicConstraints: [[] as BasicConstraint[]],
    }),
    ExtendedKeyUsage: this.formBuilder.nonNullable.group({
      enabled: [false],
      usages: [[] as ExtendedKeyUsageFlag[]],
      extension_critical: [false],
    }),
    KeyUsage: this.formBuilder.nonNullable.group({
      enabled: [false],
      KeyUsage: [[] as string[]],
    }),
  });

  readonly helptext = helptextSystemCertificates;

  readonly basicConstraintsOptions$ = of(basicConstraintOptions);
  readonly keyUsageOptions$ = of(keyUsageOptions);
  extendedKeyUsageOptions$ = of<Option[]>([]);

  private extendedKeyUsageOptions: Option[] = [];

  ngOnInit(): void {
    this.updateUsagesValidator();
    this.loadKeyUsageOptions();
  }

  hasExtension(extension: CertificateExtension): boolean {
    return this.form.getRawValue()[extension].enabled;
  }

  getSummary(): SummarySection {
    return [
      ...this.getBasicConstraintsSummary(),
      ...this.getExtendedKeyUsageSummary(),
      ...this.getKeyUsageSummary(),
    ];
  }

  getPayload(): Pick<CertificateCreate, 'cert_extensions'> {
    const {
      BasicConstraints: basicConstraints,
      ExtendedKeyUsage: extendedKeyUsage,
      KeyUsage: keyUsage,
    } = this.form.getRawValue();

    return {
      cert_extensions: {
        BasicConstraints: {
          enabled: basicConstraints.enabled,
          ca: basicConstraints.BasicConstraints.includes(BasicConstraint.Ca),
          extension_critical: basicConstraints.BasicConstraints.includes(BasicConstraint.ExtensionCritical),
          path_length: basicConstraints.path_length,
        },
        ExtendedKeyUsage: {
          enabled: extendedKeyUsage.enabled,
          extension_critical: extendedKeyUsage.extension_critical,
          usages: extendedKeyUsage.usages,
        },
        KeyUsage: {
          ...keyUsage.KeyUsage.reduce((acc, usage) => {
            return {
              ...acc,
              [usage]: true,
            };
          }, {} as KeyUsages),
          enabled: keyUsage.enabled,
        },
      },
    };
  }

  setFromProfile(extensions: CertificateExtensions): void {
    const {
      BasicConstraints: basicConstraints,
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
        value: this.form.getRawValue().BasicConstraints.BasicConstraints
          .map(findLabelsByValue(basicConstraintOptions))
          .join(', '),
      },
    ];

    if (this.form.getRawValue().BasicConstraints.path_length) {
      summary.push({
        label: this.translate.instant('Path Length'),
        value: String(this.form.getRawValue().BasicConstraints.path_length),
      });
    }

    return summary;
  }

  private getExtendedKeyUsageSummary(): SummaryItem[] {
    if (!this.hasExtension('ExtendedKeyUsage')) {
      return [];
    }

    const summary = [
      {
        label: this.translate.instant('Extended Key Usage'),
        value: this.form.getRawValue().ExtendedKeyUsage.usages
          .map(findLabelsByValue(this.extendedKeyUsageOptions))
          .join(', '),
      },
    ];

    if (this.form.getRawValue().ExtendedKeyUsage.extension_critical) {
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
        value: this.form.getRawValue().KeyUsage.KeyUsage
          .map(findLabelsByValue(keyUsageOptions))
          .join(', '),
      },
    ];
  }

  private loadKeyUsageOptions(): void {
    this.api.call('certificate.extended_key_usage_choices')
      .pipe(
        choicesToOptions(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((options) => {
        this.extendedKeyUsageOptions = options;
        this.extendedKeyUsageOptions$ = of(options);
        this.cdr.markForCheck();
      });
  }
}
