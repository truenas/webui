import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import { CertificateDetailsComponent } from 'app/pages/credentials/certificates-dash/certificate-details/certificate-details.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import {
  ViewCertificateDialogComponent,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-edit',
  templateUrl: './certificate-edit.component.html',
  styleUrls: ['./certificate-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    CertificateDetailsComponent,
    MatButton,
    TestDirective,
    FormActionsComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class CertificateEditComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isLoading = false;

  form = this.formBuilder.group({
    name: ['', Validators.required],
    add_to_trusted_store: [false],
  }) as FormGroup<{
    name: FormControl<string | null>;
    add_to_trusted_store: FormControl<boolean>;
    renew_days?: FormControl<number | null>;
  }>;

  certificate: Certificate;

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: SlideInService,
    private slideInRef: SlideInRef<CertificateEditComponent>,
    private errorHandler: FormErrorHandlerService,
    private matDialog: MatDialog,
    @Inject(SLIDE_IN_DATA) private data: Certificate,
  ) {}

  get isCsr(): boolean {
    return this.certificate?.cert_type_CSR;
  }

  ngOnInit(): void {
    this.setCertificate();
    this.setRenewDaysForEditIfAvailable();
  }

  setCertificate(): void {
    this.certificate = this.data;
    this.form.patchValue(this.certificate);
    this.cdr.markForCheck();
  }

  setRenewDaysForEditIfAvailable(): void {
    if (this.certificate?.acme) {
      this.form.addControl('renew_days', new FormControl(this.certificate?.renew_days || null));
    }
  }

  onViewCertificatePressed(): void {
    this.matDialog.open(ViewCertificateDialogComponent, {
      data: {
        certificate: this.isCsr ? this.certificate.CSR : this.certificate.certificate,
        name: this.certificate.name,
        extension: 'crt',
      } as ViewCertificateDialogData,
    });
  }

  onViewKeyPressed(): void {
    this.matDialog.open(ViewCertificateDialogComponent, {
      data: {
        certificate: this.certificate.privatekey,
        name: this.certificate.name,
        extension: 'crt',
      } as ViewCertificateDialogData,
    });
  }

  onCreateAcmePressed(): void {
    this.slideInRef.close(true);
    const slideInRef = this.slideInService.open(CertificateAcmeAddComponent, { data: this.certificate });
    slideInRef.slideInClosed$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.slideInRef.close(true));
  }

  onSubmit(): void {
    this.isLoading = true;

    this.ws.job('certificate.update', [this.certificate.id, this.form.value])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
