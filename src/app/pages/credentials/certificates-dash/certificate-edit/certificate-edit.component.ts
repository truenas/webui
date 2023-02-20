import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
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
export class CertificateEditComponent {
  isLoading = false;

  form = this.formBuilder.group({
    name: ['', Validators.required],
  });

  certificate: Certificate;

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private matDialog: MatDialog,
  ) {}

  get isCsr(): boolean {
    return this.certificate?.cert_type_CSR;
  }

  setCertificate(certificate: Certificate): void {
    this.certificate = certificate;
    this.form.patchValue(certificate);
    this.cdr.markForCheck();
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
    this.slideInService.close();
    const acmeForm = this.slideInService.open(CertificateAcmeAddComponent);
    acmeForm.setCsr(this.certificate);
  }

  onSubmit(): void {
    this.isLoading = true;

    this.ws.call('certificate.update', [this.certificate.id, this.form.value])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
