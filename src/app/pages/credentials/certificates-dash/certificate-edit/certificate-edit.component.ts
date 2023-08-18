import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import {
  ViewCertificateDialogComponent,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './certificate-edit.component.html',
  styleUrls: ['./certificate-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateEditComponent implements OnInit {
  isLoading = false;

  form = this.formBuilder.group({
    name: ['', Validators.required],
  }) as FormGroup<{
    name: FormControl<string | null>;
    renew_days?: FormControl<number | null>;
  }>;

  certificate: Certificate;

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private slideInRef: IxSlideInRef<CertificateEditComponent>,
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
      this.form.addControl('renew_days', new FormControl(null));
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
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
