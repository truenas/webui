import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Option } from 'app/interfaces/option.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { DialogService, WebSocketService } from 'app/services';
import { Observable, of } from 'rxjs';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateProfile, CertificateProfiles } from 'app/interfaces/certificate.interface';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-identifier-and-type',
  templateUrl: './certificate-identifier-and-type.component.html',
  styleUrls: ['./certificate-identifier-and-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateIdentifierAndTypeComponent implements OnInit {
  @Output() profileSelected = new EventEmitter<CertificateProfile>();

  form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      this.validators.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCertificates.add.name.errors)
      ),
    ]],
    create_type: [CertificateCreateType.CreateInternal],
    profile: [''],
  });

  profiles: CertificateProfiles;
  profileOptions$: Observable<Option[]>;

  readonly helptext = helptextSystemCertificates;

  readonly createTypes$ = of([
    { label: this.translate.instant('Internal Certificate'), value: CertificateCreateType.CreateInternal },
    { label: this.translate.instant('Import Certificate'), value: CertificateCreateType.CreateImported },
  ]);

  constructor(
    private formBuilder: FormBuilder,
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
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (profiles) => {
          this.profiles = profiles;
          const profileOptions = Object.keys(profiles).map((name) => ({ label: name, value: name }));
          this.profileOptions$ = of(profileOptions);
          this.cdr.markForCheck();
        },
        error: (error) => {
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
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
