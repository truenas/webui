import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { CaCreateType } from 'app/enums/ca-create-type.enum';
import { CertificateAuthorityUpdate } from 'app/interfaces/certificate-authority.interface';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  CaIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/steps/ca-identifier-and-type/ca-identifier-and-type.component';
import {
  CaImportComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/steps/ca-import/ca-import.component';
import {
  CertificateConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import {
  BasicConstraint,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/extensions.constants';
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
  templateUrl: './certificate-authority-add.component.html',
  styleUrls: ['./certificate-authority-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateAuthorityAddComponent implements AfterViewInit {
  @ViewChild(CaIdentifierAndTypeComponent) identifierAndType: CaIdentifierAndTypeComponent;

  // Adding new
  @ViewChild(CertificateOptionsComponent) options: CertificateOptionsComponent;
  @ViewChild(CertificateSubjectComponent) subject: CertificateSubjectComponent;
  @ViewChild(CertificateConstraintsComponent) constraints: CertificateConstraintsComponent;

  // Importing
  @ViewChild(CaImportComponent) import: CaImportComponent;

  isLoading = false;
  summary: SummarySection[];

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
    private slideInRef: IxSlideInRef<CertificateAuthorityAddComponent>,
    private dialogService: DialogService,
  ) {}

  get isImport(): boolean {
    return this.identifierAndType?.form?.value.create_type === CaCreateType.Import;
  }

  get hasSignedBy(): boolean {
    return this.identifierAndType?.form?.value.create_type === CaCreateType.Intermediate;
  }

  ngAfterViewInit(): void {
    this.setDefaultConstraints();
  }

  getNewCaSteps(): [
    CaIdentifierAndTypeComponent,
    CertificateOptionsComponent,
    CertificateSubjectComponent,
    CertificateConstraintsComponent,
  ] {
    return [this.identifierAndType, this.options, this.subject, this.constraints];
  }

  getImportCaSteps(): [CaIdentifierAndTypeComponent, CaImportComponent] {
    return [this.identifierAndType, this.import];
  }

  onProfileSelected(profile: CertificateProfile): void {
    if (!profile) {
      return;
    }

    const { cert_extensions: extensions, ...otherFields } = profile;

    this.getNewCaSteps().forEach((step) => {
      step.form.patchValue(otherFields);
    });

    this.constraints.setFromProfile(extensions);
  }

  updateSummary(): void {
    const stepsWithSummary = this.isImport ? this.getImportCaSteps() : this.getNewCaSteps();
    this.summary = stepsWithSummary.map((step) => step.getSummary());
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = this.preparePayload();
    this.ws.call('certificateauthority.create', [payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading = false;
          this.snackbar.success(this.translate.instant('Certificate authority created'));
          this.slideInRef.close(true);
        },
        error: (error: WebsocketError) => {
          this.isLoading = false;
          // TODO: Need to update error handler to open step with an error.
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      });
  }

  private preparePayload(): CertificateAuthorityUpdate {
    const steps = this.isImport ? this.getImportCaSteps() : this.getNewCaSteps();

    const values = steps.map((step) => step.getPayload());
    return _.merge({}, ...values);
  }

  private setDefaultConstraints(): void {
    this.constraints.form.patchValue({
      BasicConstraints: {
        enabled: true,
        BasicConstraints: [BasicConstraint.Ca],
      },
      KeyUsage: {
        enabled: true,
      },
    });
    this.cdr.detectChanges();
  }
}
