import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { CertificateDetailsComponent } from 'app/pages/credentials/certificates-dash/certificate-details/certificate-details.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import {
  ViewCertificateDialogComponent,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-authority-edit',
  templateUrl: './certificate-authority-edit.component.html',
  styleUrls: ['./certificate-authority-edit.component.scss'],
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
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class CertificateAuthorityEditComponent implements OnInit {
  protected readonly requiredRoles = [Role.CertificateAuthorityWrite];

  isLoading = false;

  form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    add_to_trusted_store: [false],
  });

  certificateAuthority: CertificateAuthority;

  readonly helptext = helptextSystemCertificates;

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private matDialog: MatDialog,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    public slideInRef: SlideInRef<CertificateAuthority, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.certificateAuthority = this.slideInRef.getData();
  }

  ngOnInit(): void {
    this.setCertificateAuthority();
  }

  setCertificateAuthority(): void {
    this.form.patchValue(this.certificateAuthority);
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

    this.api.call('certificateauthority.update', [this.certificateAuthority.id, this.form.value])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
