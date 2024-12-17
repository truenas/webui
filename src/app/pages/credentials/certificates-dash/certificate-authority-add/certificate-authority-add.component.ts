import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import {
  MatStepper, MatStep, MatStepLabel, MatStepperPrevious, MatStepperNext,
} from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { merge } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CaCreateType } from 'app/enums/ca-create-type.enum';
import { Role } from 'app/enums/role.enum';
import { CertificateAuthorityUpdate } from 'app/interfaces/certificate-authority.interface';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-authority-add',
  templateUrl: './certificate-authority-add.component.html',
  styleUrls: ['./certificate-authority-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    MatStepper,
    MatStep,
    MatStepLabel,
    CaIdentifierAndTypeComponent,
    CaImportComponent,
    CertificateOptionsComponent,
    CertificateSubjectComponent,
    CertificateConstraintsComponent,
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
export class CertificateAuthorityAddComponent implements AfterViewInit {
  protected readonly identifierAndType = viewChild(CaIdentifierAndTypeComponent);

  // Adding new
  protected readonly options = viewChild(CertificateOptionsComponent);
  protected readonly subject = viewChild(CertificateSubjectComponent);
  protected readonly constraints = viewChild(CertificateConstraintsComponent);

  // Importing
  protected readonly import = viewChild(CaImportComponent);

  protected readonly requiredRoles = [Role.FullAdmin];

  isLoading = false;
  summary: SummarySection[];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
    private slideInRef: SlideInRef<CertificateAuthorityAddComponent>,
    private dialogService: DialogService,
  ) {}

  get isImport(): boolean {
    return this.identifierAndType()?.form?.value.create_type === CaCreateType.Import;
  }

  get hasSignedBy(): boolean {
    return this.identifierAndType()?.form?.value.create_type === CaCreateType.Intermediate;
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
    return [this.identifierAndType(), this.options(), this.subject(), this.constraints()];
  }

  getImportCaSteps(): [CaIdentifierAndTypeComponent, CaImportComponent] {
    return [this.identifierAndType(), this.import()];
  }

  onProfileSelected(profile: CertificateProfile): void {
    if (!profile) {
      return;
    }

    const { cert_extensions: extensions, ...otherFields } = profile;

    this.getNewCaSteps().forEach((step) => {
      step.form.patchValue(otherFields);
    });

    this.constraints().setFromProfile(extensions);
  }

  updateSummary(): void {
    const stepsWithSummary = this.isImport ? this.getImportCaSteps() : this.getNewCaSteps();
    this.summary = stepsWithSummary.map((step) => step.getSummary());
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = this.preparePayload();
    this.api.call('certificateauthority.create', [payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading = false;
          this.snackbar.success(this.translate.instant('Certificate authority created'));
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isLoading = false;
          // TODO: Need to update error handler to open step with an error.
          this.dialogService.error(this.errorHandler.parseError(error));
          this.cdr.markForCheck();
        },
      });
  }

  private preparePayload(): CertificateAuthorityUpdate {
    const steps = this.isImport ? this.getImportCaSteps() : this.getNewCaSteps();

    const values = steps.map((step) => step.getPayload());
    return merge({}, ...values);
  }

  private setDefaultConstraints(): void {
    this.constraints().form.patchValue({
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
