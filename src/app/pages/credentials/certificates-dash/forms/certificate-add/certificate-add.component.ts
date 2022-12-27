import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker/lib/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateCreate, CertificateProfile, CertificateProfiles } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  CertificateCsrExistsComponent
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-csr-exists/certificate-csr-exists.component';
import {
  CertificateIdentifierAndTypeComponent
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';
import {
  CertificateOptionsComponent
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-options/certificate-options.component';
import {
  CertificateConstraintsComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import {
  CertificateImportComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-import/certificate-import.component';
import {
  CertificateSubjectComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-subject/certificate-subject.component';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { Observable, of } from 'rxjs';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';

@UntilDestroy()
@Component({
  templateUrl: './certificate-add.component.html',
  styleUrls: ['./certificate-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateAddComponent {
  @ViewChild(CertificateIdentifierAndTypeComponent) identifierAndType: CertificateIdentifierAndTypeComponent;
  @ViewChild(CertificateOptionsComponent) options: CertificateOptionsComponent;
  @ViewChild(CertificateSubjectComponent) subject: CertificateSubjectComponent;
  @ViewChild(CertificateCsrExistsComponent) csr: CertificateCsrExistsComponent;
  @ViewChild(CertificateImportComponent) import: CertificateImportComponent;
  @ViewChild(CertificateConstraintsComponent) constraints: CertificateConstraintsComponent;

  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private slideIn: IxSlideInService,
  ) {}

  get isImport(): boolean {
    return this.identifierAndType?.form?.value.create_type === CertificateCreateType.CreateImported;
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = this.preparePayload();
    this.ws.call('certificate.create', [payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.slideIn.close();
        },
        error: () => {
          // TODO: We should probably find a way to open appropriate step.
          // TODO: May need to redo how form is built.
        },
      });
  }

  onProfileSelected(_: CertificateProfile): void {

  }

  private preparePayload(): CertificateCreate {
    return {} as CertificateCreate;
  }
}
