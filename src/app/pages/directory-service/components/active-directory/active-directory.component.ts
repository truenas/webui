import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/directory-service/active-directory';
import { NssInfoType } from 'app/interfaces/active-directory.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  LeaveDomainDialogComponent,
} from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './active-directory.component.html',
  styleUrls: ['./active-directory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveDirectoryComponent implements OnInit {
  isLoading = false;
  isAdvancedMode = false;
  canLeaveDomain = false;

  form = this.formBuilder.group({
    domainname: ['', Validators.required],
    bindname: ['', Validators.required],
    bindpw: [''],
    enable: [false],
    verbose_logging: [false],
    allow_trusted_doms: [false],
    use_default_domain: [false],
    allow_dns_updates: [false],
    disable_freenas_cache: [false],
    restrict_pam: [false],
    site: [''],
    kerberos_realm: [null as number],
    kerberos_principal: [''],
    createcomputer: [''],
    timeout: [null as number],
    dns_timeout: [null as number],
    nss_info: [null as NssInfoType],
    netbiosname: ['', [Validators.required, Validators.maxLength(15)]],
    netbiosalias: [[] as string[]],
  });

  hasKerberosPrincipal$ = this.form.select((values) => values.kerberos_principal);

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
  readonly nssOptions$ = this.ws.call('activedirectory.nss_info_choices').pipe(singleArrayToOptions());

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private formBuilder: FormBuilder,
    private systemGeneralService: SystemGeneralService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private slideInRef: IxSlideInRef<ActiveDirectoryComponent>,
    private snackbarService: SnackbarService,
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
        this.snackbarService.success(
          this.translate.instant(helptext.activedirectory_custactions_clearcache_dialog_message),
        );
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.isLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }

  onLeaveDomainPressed(): void {
    const dialog = this.matDialog.open(LeaveDomainDialogComponent);
    dialog.afterClosed().pipe(untilDestroyed(this)).subscribe((leftDomain) => {
      if (!leftDomain) {
        return;
      }

      this.slideInRef.close();
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    const values = {
      ...this.form.value,
      kerberos_principal: this.form.value.kerberos_principal || '',
    };

    this.ws.call('activedirectory.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (update) => {
          this.isLoading = false;
          this.cdr.markForCheck();

          if (update.job_id) {
            this.showStartingJob(update.job_id);
          } else {
            this.slideInRef.close();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadFormValues(): void {
    this.isLoading = true;

    forkJoin([
      this.loadDirectoryState(),
      this.loadDirectoryConfig(),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  private loadDirectoryState(): Observable<void> {
    return this.ws.call('directoryservices.get_state').pipe(
      map((adState) => {
        const isHealthy = adState.activedirectory === DirectoryServiceState.Healthy;
        this.canLeaveDomain = isHealthy;

        if (isHealthy) {
          this.form.controls.netbiosname.disable();
          this.form.controls.netbiosalias.disable();
        }
      }),
    );
  }

  private loadDirectoryConfig(): Observable<void> {
    return this.ws.call('activedirectory.config').pipe(
      map((config) => {
        this.form.patchValue(config);
      }),
    );
  }

  private showStartingJob(jobId: number): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Active Directory'),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.slideInRef.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.dialogService.error(this.errorHandler.parseJobError(error));
      dialogRef.close();
    });
  }
}
