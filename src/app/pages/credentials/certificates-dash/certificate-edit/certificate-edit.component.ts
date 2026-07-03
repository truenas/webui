import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, Validators, ReactiveFormsModule, FormGroup, FormControl,
} from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnDialog, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import {
  SidePanelFooterMenu, SidePanelFooterMenuItem,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import { CertificateDetailsComponent } from 'app/pages/credentials/certificates-dash/certificate-details/certificate-details.component';
import {
  ViewCertificateDialogData,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog-data.interface';
import {
  ViewCertificateDialog,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';

@Component({
  selector: 'ix-certificate-edit',
  templateUrl: './certificate-edit.component.html',
  styleUrls: ['./certificate-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    CertificateDetailsComponent,
    TranslateModule,
  ],
})
export class CertificateEditComponent extends SidePanelForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(FormErrorHandlerService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.CertificateWrite];

  protected isLoading = signal(false);

  form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    add_to_trusted_store: [false],
  }) as FormGroup<{
    name: FormControl<string | null>;
    add_to_trusted_store: FormControl<boolean>;
    renew_days?: FormControl<number | null>;
  }>;

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  certificate: Certificate | undefined;

  /** Record to edit, supplied by the `<tn-side-panel>` host. */
  readonly editingCertificate = input<Certificate | undefined>(undefined);

  readonly helptext = helptextSystemCertificates;

  protected readonly InputType = InputType;

  get isCsr(): boolean {
    return !!this.certificate?.cert_type_CSR;
  }

  /**
   * Secondary actions rendered as a dropdown in the `<tn-side-panel>` footer next to Save (read by
   * the host container).
   *
   * Built once in `ngOnInit` (the host reads it every change-detection cycle) — `certificate` is
   * set at init and never reassigned, so the menu is stable.
   */
  footerMenu: SidePanelFooterMenu | undefined;

  private buildFooterMenu(): SidePanelFooterMenu | undefined {
    if (!this.certificate) {
      return undefined;
    }
    const items: SidePanelFooterMenuItem[] = [
      {
        label: this.isCsr ? T('View/Download CSR') : T('View/Download Certificate'),
        testId: 'view-certificate-or-csr',
        onClick: () => this.onViewCertificatePressed(),
      },
      {
        label: T('View/Download Key'),
        testId: 'view-key',
        onClick: () => this.onViewKeyPressed(),
      },
    ];
    if (this.isCsr) {
      items.push({
        label: T('Create ACME Certificate'),
        testId: 'create-acme-certificate',
        requiredRoles: this.requiredRoles,
        onClick: () => this.onCreateAcmePressed(),
      });
    }
    return { label: T('Actions'), testId: 'certificate-actions', items };
  }

  ngOnInit(): void {
    this.certificate = this.editingCertificate();
    this.setCertificate();
    this.setRenewDaysForEditIfAvailable();
    this.footerMenu = this.buildFooterMenu();
  }

  private setCertificate(): void {
    this.form.patchValue(this.certificate);
    this.cdr.markForCheck();
  }

  private setRenewDaysForEditIfAvailable(): void {
    if (this.certificate?.acme) {
      this.form.addControl('renew_days', new FormControl(this.certificate?.renew_days || null));
    }
  }

  onViewCertificatePressed(): void {
    this.tnDialog.open(ViewCertificateDialog, {
      data: {
        certificate: this.isCsr ? this.certificate.CSR : this.certificate.certificate,
        name: this.certificate.name,
        extension: this.isCsr ? 'csr' : 'crt',
        mimeType: this.isCsr ? 'application/pkcs10' : 'application/x-x509-user-cert',
      } as ViewCertificateDialogData,
    });
  }

  onViewKeyPressed(): void {
    this.tnDialog.open(ViewCertificateDialog, {
      data: {
        certificate: this.certificate.privatekey,
        name: this.certificate.name,
        extension: 'key',
        mimeType: 'application/x-pem-file',
      } as ViewCertificateDialogData,
    });
  }

  onCreateAcmePressed(): void {
    // Open the ACME form for the same CSR (stacked over this panel). On success, close
    // this edit panel with a saved result so the opener's `onSuccess` fires and the
    // dashboard reloads — matching the legacy SlideIn `swap()`, which preserved the
    // original opener's success chain. On cancel, this panel stays open underneath.
    this.formPanel.open(CertificateAcmeAddComponent, {
      title: this.translate.instant('Create ACME Certificate'),
      inputs: { csr: this.certificate },
    }).onSuccess(() => this.close(true), this.destroyRef);
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const payload = this.form.value;

    if (this.isCsr) {
      delete payload.add_to_trusted_store;
    }

    this.api.job('certificate.update', [this.certificate.id, payload])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
          this.close(true);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
