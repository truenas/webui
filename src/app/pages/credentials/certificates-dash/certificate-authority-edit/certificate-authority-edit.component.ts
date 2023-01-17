import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import {
  ViewCertificateDialogComponent,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './certificate-authority-edit.component.html',
  styleUrls: ['./certificate-authority-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateAuthorityEditComponent {
  isLoading = false;

  form = this.formBuilder.group({
    name: ['', Validators.required],
  });

  certificateAuthority: CertificateAuthority;

  readonly helptext = helptextSystemCertificates;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
  ) {}

  setCertificateAuthority(certificateAuthority: CertificateAuthority): void {
    this.certificateAuthority = certificateAuthority;
    this.form.patchValue(certificateAuthority);
    this.cdr.markForCheck();
  }

  onViewCertificatePressed(): void {
    this.matDialog.open(ViewCertificateDialogComponent, {
      data: {
        certificate: this.certificateAuthority.certificate,
        name: this.certificateAuthority.name,
        extension: 'crt',
      } as ViewCertificateDialogData,
    });
  }

  onViewKeyPressed(): void {
    this.matDialog.open(ViewCertificateDialogComponent, {
      data: {
        certificate: this.certificateAuthority.privatekey,
        name: this.certificateAuthority.name,
        extension: 'crt',
      } as ViewCertificateDialogData,
    });
  }

  onSubmit(): void {
    this.isLoading = true;

    this.ws.call('certificateauthority.update', [this.certificateAuthority.id, this.form.value])
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
