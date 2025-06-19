import {
  ChangeDetectionStrategy, Component, signal, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import {
  MatStepper, MatStep, MatStepLabel, MatStepperPrevious, MatStepperNext,
} from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { merge } from 'lodash-es';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Role } from 'app/enums/role.enum';
import { CertificateCreate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  UseIxIconsInStepperComponent,
} from 'app/modules/ix-icon/use-ix-icons-in-stepper/use-ix-icons-in-stepper.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CsrConstraintsComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-constraints/csr-constraints.component';
import {
  CsrIdentifierAndTypeComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-identifier-and-type/csr-identifier-and-type.component';
import {
  CsrImportComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-import/csr-import.component';
import {
  CsrOptionsComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-options/csr-options.component';
import {
  CsrSubjectComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-subject/csr-subject.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-csr-add',
  templateUrl: './csr-add.component.html',
  styleUrls: ['./csr-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    MatStepper,
    MatStep,
    MatStepLabel,
    CsrIdentifierAndTypeComponent,
    CsrImportComponent,
    CsrOptionsComponent,
    CsrSubjectComponent,
    CsrConstraintsComponent,
    SummaryComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    RequiresRolesDirective,
    MatStepperNext,
    TranslateModule,
    UseIxIconsInStepperComponent,
  ],
})
export class CsrAddComponent {
  protected readonly identifierAndType = viewChild.required(CsrIdentifierAndTypeComponent);

  // Adding new
  protected readonly options = viewChild(CsrOptionsComponent);
  protected readonly subject = viewChild(CsrSubjectComponent);
  protected readonly constraints = viewChild(CsrConstraintsComponent);

  // Importing
  protected readonly import = viewChild(CsrImportComponent);

  protected readonly requiredRoles = [Role.CertificateWrite];

  protected isLoading = signal(false);
  summary: SummarySection[];

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(Boolean(this.identifierAndType()?.form?.dirty));
    });
  }

  get isImport(): boolean {
    return this.identifierAndType()?.form?.value.create_type === CertificateCreateType.ImportCsr;
  }

  private getNewCsrSteps(): [
    CsrIdentifierAndTypeComponent,
    CsrOptionsComponent?,
    CsrSubjectComponent?,
    CsrConstraintsComponent?,
  ] {
    return [this.identifierAndType(), this.options(), this.subject(), this.constraints()];
  }

  private getImportCsrSteps(): [
    CsrIdentifierAndTypeComponent,
    CsrImportComponent?,
  ] {
    return [this.identifierAndType(), this.import()];
  }

  // TODO: Similar code between all certificate forms.
  onProfileSelected(profile: CertificateProfile): void {
    if (!profile) {
      return;
    }

    const { cert_extensions: extensions, ...otherFields } = profile;

    this.getNewCsrSteps()
      .filter((step) => !!step)
      .forEach((step) => {
        step.form.patchValue(otherFields);
      });

    this.constraints()?.setFromProfile(extensions);
  }

  updateSummary(): void {
    const stepsWithSummary = this.isImport ? this.getImportCsrSteps() : this.getNewCsrSteps();
    this.summary = stepsWithSummary
      .map((step) => step?.getSummary())
      .filter((summary) => !!summary);
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const payload = this.preparePayload();
    this.api.job('certificate.create', [payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading.set(false);
          this.snackbar.success(this.translate.instant('Certificate signing request created'));
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          // TODO: Need to update error handler to open step with an error.
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private preparePayload(): CertificateCreate {
    const steps = this.isImport ? this.getImportCsrSteps() : this.getNewCsrSteps();

    const values = steps
      .filter((step) => !!step)
      .map((step) => step.getPayload());
    return merge({}, ...values);
  }
}
