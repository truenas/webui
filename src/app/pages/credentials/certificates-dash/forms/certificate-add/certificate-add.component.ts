import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateCreate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import {
  CertificateCsrExistsComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-csr-exists/certificate-csr-exists.component';
import {
  CertificateIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';
import {
  CertificateOptionsComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-options/certificate-options.component';
import {
  CertificateConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import {
  CertificateImportComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-import/certificate-import.component';
import {
  CertificateSubjectComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-subject/certificate-subject.component';
import { DialogService, WebSocketService2 } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './certificate-add.component.html',
  styleUrls: ['./certificate-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateAddComponent {
  @ViewChild(CertificateIdentifierAndTypeComponent) identifierAndType: CertificateIdentifierAndTypeComponent;

  // Adding new certificate
  @ViewChild(CertificateOptionsComponent) options: CertificateOptionsComponent;
  @ViewChild(CertificateSubjectComponent) subject: CertificateSubjectComponent;
  @ViewChild(CertificateConstraintsComponent) constraints: CertificateConstraintsComponent;

  // Importing existing certificate
  @ViewChild(CertificateCsrExistsComponent) csr: CertificateCsrExistsComponent;
  @ViewChild(CertificateImportComponent) import: CertificateImportComponent;

  isLoading = false;
  summary: SummarySection[];

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService2,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private slideIn: IxSlideInService,
  ) {}

  get isImport(): boolean {
    return this.identifierAndType?.form?.value.create_type === CertificateCreateType.CreateImported;
  }

  getNewCertificateSteps(): [
    CertificateIdentifierAndTypeComponent,
    CertificateOptionsComponent,
    CertificateSubjectComponent,
    CertificateConstraintsComponent,
  ] {
    return [this.identifierAndType, this.options, this.subject, this.constraints];
  }

  getImportCertificateSteps(): [
    CertificateIdentifierAndTypeComponent,
    CertificateCsrExistsComponent,
    CertificateImportComponent,
  ] {
    return [this.identifierAndType, this.csr, this.import];
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

  onProfileSelected(profile: CertificateProfile): void {
    const { cert_extensions: extensions, ...otherFields } = profile;

    this.getNewCertificateSteps().forEach((step) => {
      step.form.patchValue(otherFields);
    });

    this.constraints.setFromProfile(extensions);
  }

  updateSummary(): void {
    const stepsWithSummary = this.isImport ? this.getImportCertificateSteps() : this.getNewCertificateSteps();
    this.summary = stepsWithSummary.map((form) => form.getSummary());
  }

  private preparePayload(): CertificateCreate {
    return {} as CertificateCreate;
  }
}
