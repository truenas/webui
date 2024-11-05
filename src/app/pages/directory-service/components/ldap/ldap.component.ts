import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextLdap } from 'app/helptext/directory-service/ldap';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ldap',
  templateUrl: './ldap.component.html',
  styleUrls: ['./ldap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxChipsComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    WithManageCertificatesLinkComponent,
    IxTextareaComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class LdapComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];

  isLoading = false;
  isAdvancedMode = false;

  form = this.formBuilder.group({
    hostname: [[] as string[], this.validatorsService.validateOnCondition(
      (control) => (control.parent?.value as { enable: boolean })?.enable,
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
    auxiliary_parameters: [''],
    schema: [''],
  });

  readonly helptext = helptextLdap;
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
    private errorHandler: ErrorHandlerService,
    private slideInRef: SlideInRef<LdapComponent>,
    private translate: TranslateService,
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
    this.dialogService
      .jobDialog(this.systemGeneralService.refreshDirServicesCache())
      .afterClosed()
      .pipe(untilDestroyed(this)).subscribe({
        next: ({ description }) => {
          this.isLoading = false;
          this.snackbar.success(
            this.translate.instant(description || helptextLdap.ldap_custactions_clearcache_dialog_message),
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

  onSubmit(): void {
    this.isLoading = true;
    const values = this.form.value;

    this.dialogService.jobDialog(
      this.ws.job('ldap.update', [values]),
      {
        title: 'LDAP',
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('LDAP configuration updated'));
          this.slideInRef.close(true);
        },
        complete: () => {
          this.isLoading = false;
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
        error: (error: unknown) => {
          this.isLoading = false;
          this.dialogService.error(this.errorHandler.parseError(error));
          this.cdr.markForCheck();
        },
      });
  }
}
