import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions, idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-acme-add',
  templateUrl: './certificate-acme-add.component.html',
  styleUrls: ['./certificate-acme-add.component.scss'],
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
    IxSelectComponent,
    IxListComponent,
    IxListItemComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class CertificateAcmeAddComponent implements OnInit {
  protected readonly requiredRoles = [Role.CertificateWrite];

  form = this.formBuilder.nonNullable.group({
    name: ['', [
      Validators.required,
      this.validatorsService.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCertificates.add.name.errors),
      ),
    ]],
    tos: [false, Validators.requiredTrue],
    renew_days: [10, [Validators.required, Validators.min(0)]],
    acme_directory_uri: ['', Validators.required],
    custom_acme_directory_uri: [false],
    domains: this.formBuilder.array<string>([]),
  });

  protected csr: Certificate;

  isLoading = false;
  domains: string[] = [];

  readonly acmeDirectoryUris$ = this.api.call('certificate.acme_server_choices').pipe(choicesToOptions());
  readonly authenticators$ = this.api.call('acme.dns.authenticator.query').pipe(idNameArrayToOptions());

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private formErrorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<Certificate, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.csr = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.csr) {
      this.loadDomains();
    }
  }

  onSubmit(): void {
    const formValues = this.form.getRawValue();

    const dnsMapping = this.domains.reduce((mapping, domain, i) => {
      return {
        ...mapping,
        [domain]: formValues.domains[i],
      };
    }, {} as Record<string, string>);

    const payload = {
      name: formValues.name,
      csr_id: this.csr.id,
      tos: formValues.tos,
      create_type: CertificateCreateType.CreateAcme,
      renew_days: formValues.renew_days,
      acme_directory_uri: formValues.acme_directory_uri,
      dns_mapping: dnsMapping,
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.dialogService.jobDialog(
      this.api.job('certificate.create', [payload]),
      {
        title: this.translate.instant('Creating ACME Certificate'),
      },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.slideInRef.close({ response: true, error: null });
          this.snackbar.success(this.translate.instant('ACME Certificate Created'));
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private loadDomains(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.api.call('webui.crypto.get_certificate_domain_names', [this.csr.id])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (domains) => {
          this.domains = domains;
          domains.forEach((domain) => this.addDomainControls(domain));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  private addDomainControls(domain: string): void {
    this.form.controls.domains.push(
      this.formBuilder.control(domain, Validators.required),
    );
  }
}
