import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateCreate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  CsrIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-identifier-and-type/csr-identifier-and-type.component';
import {
  CsrImportComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-import/csr-import.component';
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
  templateUrl: './csr-add.component.html',
  styleUrls: ['./csr-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsrAddComponent {
  @ViewChild(CsrIdentifierAndTypeComponent) identifierAndType: CsrIdentifierAndTypeComponent;

  // Adding new
  @ViewChild(CertificateOptionsComponent) options: CertificateOptionsComponent;
  @ViewChild(CertificateSubjectComponent) subject: CertificateSubjectComponent;
  @ViewChild(CertificateConstraintsComponent) constraints: CertificateConstraintsComponent;

  // Importing
  @ViewChild(CsrImportComponent) import: CsrImportComponent;

  isLoading = false;
  summary: SummarySection[];

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<CsrAddComponent>,
    private dialogService: DialogService,
  ) { }

  get isImport(): boolean {
    return this.identifierAndType?.form?.value.create_type === CertificateCreateType.ImportCsr;
  }

  getNewCsrSteps(): [
    CsrIdentifierAndTypeComponent,
    CertificateOptionsComponent,
    CertificateSubjectComponent,
    CertificateConstraintsComponent,
  ] {
    return [this.identifierAndType, this.options, this.subject, this.constraints];
  }

  getImportCsrSteps(): [
    CsrIdentifierAndTypeComponent,
    CsrImportComponent,
  ] {
    return [this.identifierAndType, this.import];
  }

  // TODO: Similar code between all certificate forms.
  onProfileSelected(profile: CertificateProfile): void {
    if (!profile) {
      return;
    }

    const { cert_extensions: extensions, ...otherFields } = profile;

    this.getNewCsrSteps().forEach((step) => {
      step.form.patchValue(otherFields);
    });

    this.constraints.setFromProfile(extensions);
  }

  updateSummary(): void {
    const stepsWithSummary = this.isImport ? this.getImportCsrSteps() : this.getNewCsrSteps();
    this.summary = stepsWithSummary.map((step) => step.getSummary());
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
          this.snackbar.success(this.translate.instant('Certificate signing request created'));
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

  private preparePayload(): CertificateCreate {
    const steps = this.isImport ? this.getImportCsrSteps() : this.getNewCsrSteps();

    const values = steps.map((step) => step.getPayload());
    return _.merge({}, ...values);
  }
}
