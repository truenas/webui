import {
  ChangeDetectionStrategy, Component, DestroyRef, output, signal, viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnStepComponent, TnStepperComponent, TnStepperPreviousDirective,
} from '@truenas/ui-components';
import { merge } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Role } from 'app/enums/role.enum';
import { CertificateCreate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SidePanelHostCloseable } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { SummarySection } from 'app/modules/summary/summary.interface';
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

@Component({
  selector: 'ix-csr-add',
  templateUrl: './csr-add.component.html',
  styleUrls: ['./csr-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnStepperComponent,
    TnStepComponent,
    CsrIdentifierAndTypeComponent,
    CsrImportComponent,
    CsrOptionsComponent,
    CsrSubjectComponent,
    CsrConstraintsComponent,
    SummaryComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnStepperPreviousDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class CsrAddComponent implements SidePanelHostCloseable {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  // Hosted in a footerless `<tn-side-panel>` (via `FormSidePanelService`) that owns the wizard's
  // chrome; the wizard drives its own Next/Back/Save inside the stepper steps. It therefore
  // satisfies only the minimal SidePanelHostCloseable surface — not the fuller SidePanelForm.

  /** Emitted to the `<tn-side-panel>` host when the wizard closes (`true` on save). */
  readonly closed = output<boolean>();

  protected readonly identifierAndType = viewChild.required(CsrIdentifierAndTypeComponent);

  // Adding new
  // TODO: Should be protected, but used in the test.
  readonly options = viewChild(CsrOptionsComponent);
  readonly subject = viewChild(CsrSubjectComponent);
  readonly constraints = viewChild(CsrConstraintsComponent);

  // Importing
  protected readonly import = viewChild(CsrImportComponent);

  protected readonly requiredRoles = [Role.CertificateWrite];

  protected isLoading = signal(false);
  protected summary: SummarySection[];

  hasUnsavedChanges(): boolean {
    return Boolean(this.identifierAndType()?.form?.dirty);
  }

  /** Whether a create job is in flight — the `<tn-side-panel>` host reads this for its progress bar. */
  isBusy(): boolean {
    return this.isLoading();
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => {
          this.isLoading.set(false);
          this.snackbar.success(this.translate.instant('Certificate signing request created'));
          this.close(true);
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

  /** Closes the wizard, handing the saved result back to the `<tn-side-panel>` host. */
  private close(saved: boolean): void {
    this.closed.emit(saved);
  }
}
