import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { CaCreateType } from 'app/enums/ca-create-type.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { CertificateProfile, CertificateProfiles } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ca-identifier-and-type',
  styleUrls: ['./ca-identifier-and-type.component.scss'],
  templateUrl: './ca-identifier-and-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaIdentifierAndTypeComponent implements OnInit, SummaryProvider {
  @Output() profileSelected = new EventEmitter<CertificateProfile>();

  form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      this.validators.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCa.add.name.errors),
      ),
    ]],
    create_type: [CaCreateType.Internal],
    profile: [''],
    add_to_trusted_store: [false],
  });

  profiles: CertificateProfiles;
  profileOptions$: Observable<Option[]>;

  readonly helptext = helptextSystemCa;

  readonly createTypes = new Map<CaCreateType, string>([
    [CaCreateType.Internal, this.translate.instant('Internal CA')],
    [CaCreateType.Intermediate, this.translate.instant('Intermediate CA')],
    [CaCreateType.Import, this.translate.instant('Import CA')],
  ]);
  readonly createTypes$ = of(mapToOptions(this.createTypes, this.translate));

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private validators: IxValidatorsService,
  ) {}

  get isCaImport(): boolean {
    return this.form.value.create_type === CaCreateType.Import;
  }

  get isIntermediate(): boolean {
    return this.form.value.create_type === CaCreateType.Intermediate;
  }

  ngOnInit(): void {
    this.loadProfiles();
    this.emitEventOnProfileChange();
  }

  private loadProfiles(): void {
    this.ws.call('certificateauthority.profiles')
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
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

  getPayload(): Pick<CaIdentifierAndTypeComponent['form']['value'], 'name' | 'create_type' | 'add_to_trusted_store'> {
    return _.pick(this.form.value, ['name', 'create_type', 'add_to_trusted_store']);
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
