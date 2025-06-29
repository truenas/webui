import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextActiveDirectory } from 'app/helptext/directory-service/active-directory';
import { ActiveDirectoryUpdate, NssInfoType } from 'app/interfaces/active-directory.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  LeaveDomainDialog,
} from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-active-directory',
  templateUrl: './active-directory.component.html',
  styleUrls: ['./active-directory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxChipsComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ActiveDirectoryComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];

  protected isLoading = signal(false);
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
    kerberos_realm: new FormControl(null as number | null),
    kerberos_principal: [''],
    createcomputer: [''],
    timeout: new FormControl(null as number | null),
    dns_timeout: new FormControl(null as number | null),
    nss_info: new FormControl(null as NssInfoType | null),
    netbiosname: ['', [Validators.required, Validators.maxLength(15)]],
    netbiosalias: [[] as string[]],
  });

  hasKerberosPrincipal$ = this.form.select((values) => values.kerberos_principal);

  readonly helptext = helptextActiveDirectory;
  readonly kerberosRealms$ = this.api.call('kerberos.realm.query').pipe(
    map((realms) => {
      return realms.map((realm) => ({
        label: ignoreTranslation(realm.realm),
        value: realm.id,
      }));
    }),
  );

  readonly kerberosPrincipals$ = this.api.call('kerberos.keytab.kerberos_principal_choices').pipe(singleArrayToOptions());
  readonly nssOptions$ = this.api.call('activedirectory.nss_info_choices').pipe(singleArrayToOptions());

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private formBuilder: FormBuilder,
    private systemGeneralService: SystemGeneralService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private snackbarService: SnackbarService,
    public slideInRef: SlideInRef<ActiveDirectoryComponent | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.loadFormValues();
  }

  protected onAdvancedModeToggled(): void {
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  protected onRebuildCachePressed(): void {
    this.isLoading.set(true);
    this.dialogService
      .jobDialog(this.systemGeneralService.refreshDirServicesCache())
      .afterClosed()
      .pipe(untilDestroyed(this)).subscribe({
        next: ({ description }) => {
          this.isLoading.set(false);
          this.snackbarService.success(
            this.translate.instant(
              description || helptextActiveDirectory.cacheRebuilt,
            ),
          );
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  protected onLeaveDomainPressed(): void {
    const dialog = this.matDialog.open(LeaveDomainDialog);
    dialog.afterClosed().pipe(untilDestroyed(this)).subscribe((leftDomain) => {
      if (!leftDomain) {
        return;
      }

      this.slideInRef.close({ response: true });
    });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    const values = {
      ...this.form.value,
      kerberos_principal: this.form.value.kerberos_principal || '',
    } as ActiveDirectoryUpdate;

    this.dialogService.jobDialog(
      this.api.job('activedirectory.update', [values]),
      { title: this.translate.instant('Active Directory') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => this.slideInRef.close({ response: true }),
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  private loadFormValues(): void {
    this.isLoading.set(true);

    forkJoin([
      this.loadDirectoryState(),
      this.loadDirectoryConfig(),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private loadDirectoryState(): Observable<void> {
    return this.api.call('directoryservices.get_state').pipe(
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
    return this.api.call('activedirectory.config').pipe(
      map((config) => {
        this.form.patchValue(config);
      }),
    );
  }
}
