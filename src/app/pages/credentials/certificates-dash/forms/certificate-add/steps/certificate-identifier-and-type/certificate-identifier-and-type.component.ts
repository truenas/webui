import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, output,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { pick } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateProfile, CertificateProfiles } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-identifier-and-type',
  templateUrl: './certificate-identifier-and-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    MatStepperNext,
    TestDirective,
    TranslateModule,
  ],
})
export class CertificateIdentifierAndTypeComponent implements OnInit, SummaryProvider {
  readonly profileSelected = output<CertificateProfile>();

  form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      this.validators.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCertificates.add.name.errors),
      ),
    ]],
    create_type: [CertificateCreateType.CreateInternal],
    profile: [''],
    add_to_trusted_store: [false],
  });

  profiles: CertificateProfiles;
  profileOptions$: Observable<Option[]>;

  readonly helptext = helptextSystemCertificates;

  readonly createTypes = new Map<CertificateCreateType, string>([
    [CertificateCreateType.CreateInternal, this.translate.instant('Internal Certificate')],
    [CertificateCreateType.Import, this.translate.instant('Import Certificate')],
  ]);

  readonly createTypes$ = of(mapToOptions(this.createTypes, this.translate));

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private validators: IxValidatorsService,
  ) {}

  get isInternalCertificate(): boolean {
    return this.form.value.create_type === CertificateCreateType.CreateInternal;
  }

  ngOnInit(): void {
    this.loadProfiles();
    this.emitEventOnProfileChange();
  }

  private loadProfiles(): void {
    this.ws.call('webui.crypto.certificate_profiles')
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((profiles) => {
        this.profiles = profiles;
        const profileOptions = Object.keys(profiles).map((name) => ({ label: name, value: name }));
        this.profileOptions$ = of(profileOptions);
        this.cdr.markForCheck();
      });
  }

  getSummary(): SummarySection {
    const values = this.form.value;

    const summary = [
      { label: this.translate.instant('Name'), value: values.name },
      { label: this.translate.instant('Type'), value: this.createTypes.get(values.create_type) },
    ];

    if (values.profile) {
      summary.push({ label: this.translate.instant('Profile'), value: values.profile });
    }

    if (values.add_to_trusted_store) {
      summary.push({ label: this.translate.instant('Add To Trusted Store'), value: this.translate.instant('Yes') });
    }

    return summary;
  }

  getPayload(): Pick<CertificateIdentifierAndTypeComponent['form']['value'], 'name' | 'create_type' | 'add_to_trusted_store'> {
    return pick(this.form.value, ['name', 'create_type', 'add_to_trusted_store']);
  }

  private emitEventOnProfileChange(): void {
    this.form.controls.profile.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((profileName) => {
        const profile = this.profiles[profileName];
        this.profileSelected.emit(profile);
      });
  }
}
