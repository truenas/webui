import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateProfile, CertificateProfiles } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-identifier-and-type',
  templateUrl: './certificate-identifier-and-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateIdentifierAndTypeComponent implements OnInit, SummaryProvider {
  @Output() profileSelected = new EventEmitter<CertificateProfile>();

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
    this.ws.call('certificate.profiles')
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

    return summary;
  }

  getPayload(): Pick<CertificateIdentifierAndTypeComponent['form']['value'], 'name' | 'create_type'> {
    return _.pick(this.form.value, ['name', 'create_type']);
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
