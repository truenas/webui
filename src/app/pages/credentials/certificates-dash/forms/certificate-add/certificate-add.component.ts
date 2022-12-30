import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateCreate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { Summary } from 'app/modules/common/summary/summary.component';
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
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
  summary: Summary;

  private summaryBySection = new Map<string, Summary>();

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

  onSummaryUpdated(section: string, value: Summary): void {
    this.summaryBySection.set(section, value);
    // TODO: Move somewhere?
    this.summary = Array.from(this.summaryBySection.entries()).reduce((summary, [_, sectionSummary]) => {
      return {
        ...summary,
        ...sectionSummary,
      };
    }, {});
  }

  private preparePayload(): CertificateCreate {
    return {} as CertificateCreate;
  }
}
