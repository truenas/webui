import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { idNameArrayToOptions, singleArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/directory-service/ldap';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DialogService, ModalService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './ldap.component.html',
  styleUrls: ['./ldap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LdapComponent implements OnInit {
  isLoading = false;
  isAdvancedMode = false;

  form = this.formBuilder.group({
    hostname: [[] as string[], this.validatorsService.validateOnCondition(
      (control) => control.parent?.value.enable,
      Validators.required,
    )],
    basedn: [''],
    binddn: [''],
    bindpw: [''],
    enable: [false],
    anonbind: [false],
    ssl: [''],
    certificate: [null as number],
    validate_certificates: [false],
    disable_freenas_cache: [false],
    kerberos_realm: [null as number],
    kerberos_principal: [''],
    timeout: [null as number],
    dns_timeout: [null as number],
    has_samba_schema: [false],
    auxiliary_parameters: [''],
    schema: [''],
  });

  readonly helptext = helptext;
  readonly kerberosRealms$ = this.ws.call('kerberos.realm.query').pipe(
    map((realms) => {
      return realms.map((realm) => ({
        label: realm.realm,
        value: realm.id,
      }));
    }),
  );
  readonly kerberosPrincipals$ = this.ws.call('kerberos.keytab.kerberos_principal_choices').pipe(singleArrayToOptions());
  readonly sslOptions$ = this.ws.call('ldap.ssl_choices').pipe(singleArrayToOptions());
  readonly certificates$ = this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions());
  readonly schemaOptions$ = this.ws.call('ldap.schema_choices').pipe(singleArrayToOptions());
  readonly isEnabled$ = this.form.select((values) => values.enable);

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private systemGeneralService: SystemGeneralService,
    private dialogService: DialogService,
    private validatorsService: IxValidatorsService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private matDialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private modalService: ModalService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadFormValues();
  }

  onAdvancedModeToggled(): void {
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  onRebuildCachePressed(): void {
    this.isLoading = true;
    this.systemGeneralService.refreshDirServicesCache().pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackbar.success(
          this.translate.instant(helptext.ldap_custactions_clearcache_dialog_message),
        );
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        new EntityUtils().handleWsError(this, error, this.dialogService);
        this.cdr.markForCheck();
      },
    });
  }

  onManageCertificatesClicked(): void {
    this.router.navigate(['/', 'credentials', 'certificates']);
    this.slideInService.close(null, false);
  }

  onSubmit(): void {
    this.isLoading = true;
    const values = this.form.value;

    this.ws.call('ldap.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (update) => {
          this.isLoading = false;
          this.cdr.markForCheck();

          if (update.job_id) {
            this.showStartingJob(update.job_id);
          } else {
            this.slideInService.close();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadFormValues(): void {
    this.isLoading = true;

    this.ws.call('ldap.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.cdr.markForCheck();
        },
      });
  }

  private showStartingJob(jobId: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Setting up LDAP'),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.slideInService.close();
      this.modalService.refreshTable();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      new EntityUtils().handleWsError(this, error, this.dialogService);
      this.modalService.refreshTable();
      dialogRef.close();
    });
  }
}
