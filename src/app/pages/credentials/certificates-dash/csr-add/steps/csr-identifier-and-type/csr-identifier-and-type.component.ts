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
import { helptextSystemCa } from 'app/helptext/system/ca';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateProfile, CertificateProfiles } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-csr-identifier-and-type',
  templateUrl: './csr-identifier-and-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    MatStepperNext,
    TestDirective,
    TranslateModule,
  ],
})
export class CsrIdentifierAndTypeComponent implements OnInit, SummaryProvider {
  readonly profileSelected = output<CertificateProfile>();

  form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      this.validators.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCa.add.name.errors),
      ),
    ]],
    create_type: [CertificateCreateType.CreateCsr],
    profile: [''],
  });

  profiles: CertificateProfiles;
  profileOptions$: Observable<Option[]>;

  readonly helptext = helptextSystemCertificates;

  readonly createTypes = new Map<CertificateCreateType, string>([
    [CertificateCreateType.CreateCsr, this.translate.instant('Certificate Signing Request')],
    [CertificateCreateType.ImportCsr, this.translate.instant('Import Certificate Signing Request')],
  ]);

  readonly createTypes$ = of(mapToOptions(this.createTypes, this.translate));

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private validators: IxValidatorsService,
  ) {}

  get isImport(): boolean {
    return this.form.value.create_type === CertificateCreateType.ImportCsr;
  }

  ngOnInit(): void {
    this.loadProfiles();
    this.emitEventOnProfileChange();
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

    return summary;
  }

  getPayload(): Pick<CsrIdentifierAndTypeComponent['form']['value'], 'name' | 'create_type'> {
    return pick(this.form.value, ['name', 'create_type']);
  }

  private loadProfiles(): void {
    this.ws.call('webui.crypto.csr_profiles')
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((profiles) => {
        this.profiles = profiles;
        const profileOptions = Object.keys(profiles).map((name) => ({ label: name, value: name }));
        this.profileOptions$ = of(profileOptions);
        this.cdr.markForCheck();
      });
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
