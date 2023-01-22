import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import {
  FormBuilder, Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { choicesToOptions, idNameArrayToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService2 } from 'app/services/ws2.service';

@UntilDestroy()
@Component({
  templateUrl: './certificate-acme-add.component.html',
  styleUrls: ['./certificate-acme-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateAcmeAddComponent {
  form = this.formBuilder.group({
    name: ['', [
      Validators.required,
      // TODO: Maybe extract somewhere.
      this.validatorsService.withMessage(
        Validators.pattern('[A-Za-z0-9_-]+$'),
        this.translate.instant(helptextSystemCertificates.add.name.errors),
      ),
    ]],
    tos: [false, Validators.requiredTrue],
    renew_days: [10, [Validators.required, Validators.min(0)]],
    acme_directory_uri: ['', Validators.required],
    domains: this.formBuilder.array<string>([]),
  });

  isLoading = false;
  domains: string[] = [];

  readonly acmeDirectoryUris$ = this.ws.call('certificate.acme_server_choices').pipe(choicesToOptions());
  readonly authenticators$ = this.ws.call('acme.dns.authenticator.query').pipe(idNameArrayToOptions());

  readonly helptext = helptextSystemCertificates;

  private csr: Certificate;

  constructor(
    private formBuilder: FormBuilder,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
    private ws: WebSocketService2,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private slideIn: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private mdDialog: MatDialog,
  ) { }

  setCsr(csr: Certificate): void {
    this.csr = csr;
    this.loadDomains();
  }

  onSubmit(): void {
    const formValues = this.form.value;

    const dnsMapping = this.domains.reduce((mapping, domain, i) => {
      mapping[domain] = formValues.domains[i];
      return mapping;
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

    const dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: 'Creating ACME Certificate' }, disableClose: true });
    dialogRef.componentInstance.setCall('certificate.create', [payload]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLoading = false;
      this.mdDialog.closeAll();
      this.cdr.markForCheck();
      this.slideIn.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.isLoading = false;
      this.mdDialog.closeAll();
      this.cdr.markForCheck();
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }

  private loadDomains(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.ws.call('certificate.get_domain_names', [this.csr.id])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (domains) => {
          this.domains = domains;
          domains.forEach((domain) => this.addDomainControls(domain));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }

  private addDomainControls(domain: string): void {
    this.form.controls.domains.push(
      this.formBuilder.control(domain, Validators.required),
    );
  }
}
