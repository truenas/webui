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
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextActiveDirectory } from 'app/helptext/directory-service/active-directory';
import { NssInfoType } from 'app/interfaces/active-directory.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { activeDirectoryElements } from 'app/pages/directory-service/components/active-directory/active-directory.elements';
import {
  LeaveDomainDialogComponent,
} from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-active-directory',
  templateUrl: './active-directory.component.html',
  styleUrls: ['./active-directory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveDirectoryComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = activeDirectoryElements;

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

  readonly helptext = helptextActiveDirectory;
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
          this.translate.instant(helptextActiveDirectory.activedirectory_custactions_clearcache_dialog_message),
        );
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
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

    this.dialogService.jobDialog(
      this.ws.job('activedirectory.update', [values]),
      { title: this.translate.instant('Active Directory') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => this.slideInRef.close(true),
        complete: () => {
          this.isLoading = false;
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
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseError(error));
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
}
