import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateCreate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  CertificateIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';
import {
  CertificateImportComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-import/certificate-import.component';
import {
  CertificateConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import {
  CertificateOptionsComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-options/certificate-options.component';
import {
  CertificateSubjectComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-subject/certificate-subject.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
  @ViewChild(CertificateImportComponent) import: CertificateImportComponent;

  isLoading = false;
  summary: SummarySection[];

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private slideInRef: IxSlideInRef<CertificateAddComponent>,
    private snackbar: SnackbarService,
  ) {}

  get isImport(): boolean {
    return this.identifierAndType?.form?.value.create_type === CertificateCreateType.Import;
  }

  getNewCertificateSteps(): [
    CertificateIdentifierAndTypeComponent,
    CertificateOptionsComponent,
    CertificateSubjectComponent,
    CertificateConstraintsComponent,
  ] {
    return [this.identifierAndType, this.options, this.subject, this.constraints];
  }

  getImportCertificateSteps(): [CertificateIdentifierAndTypeComponent, CertificateImportComponent] {
    return [this.identifierAndType, this.import];
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = this.preparePayload();
    this.ws.job('certificate.create', [payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading = false;
          this.snackbar.success(this.translate.instant('Certificate has been created.'));
          this.slideInRef.close(true);
        },
        error: (error: WebsocketError) => {
          this.isLoading = false;
          this.cdr.markForCheck();

          // TODO: Need to update error handler to open step with an error.
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  onProfileSelected(profile: CertificateProfile): void {
    if (!profile) {
      return;
    }

    const { cert_extensions: extensions, ...otherFields } = profile;

    this.getNewCertificateSteps().forEach((step) => {
      step.form.patchValue(otherFields);
    });

    this.constraints.setFromProfile(extensions);
  }

  updateSummary(): void {
    const stepsWithSummary = this.isImport ? this.getImportCertificateSteps() : this.getNewCertificateSteps();
    this.summary = stepsWithSummary.map((step) => step.getSummary());
  }

  private preparePayload(): CertificateCreate {
    const steps = this.isImport ? this.getImportCertificateSteps() : this.getNewCertificateSteps();

    const values = steps.map((step) => step.getPayload());
    return _.merge({}, ...values);
  }
}
