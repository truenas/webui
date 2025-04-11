import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of, tap } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import {
  IdmapBackend, IdmapLinkedService, IdmapName, IdmapSchemaMode, IdmapSslEncryptionMode,
} from 'app/enums/idmap.enum';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextIdmap } from 'app/helptext/directory-service/idmap';
import { IdmapBackendOption, IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { Idmap, IdmapUpdate } from 'app/interfaces/idmap.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { IdmapService } from 'app/services/idmap.service';

const minAllowedRange = 1000;
const maxAllowedRange = 2147483647;
const customIdmapName = 'custom';

@UntilDestroy()
@Component({
  selector: 'ix-idmap-form',
  templateUrl: './idmap-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxInputComponent,
    WithManageCertificatesLinkComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class IdmapFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Idmap')
      : this.translate.instant('Edit Idmap');
  }

  get isNew(): boolean {
    return !this.existingIdmap;
  }

  protected existingIdmap: Idmap | undefined;

  form = this.formBuilder.group({
    idmap_backend: [IdmapBackend.Ad],
    name: new FormControl(null as IdmapName | typeof customIdmapName | null, Validators.required),
    custom_name: ['', this.validationHelpers.validateOnCondition(
      (control) => (control.parent?.value as { name: string })?.name === customIdmapName,
      Validators.required,
    )],
    dns_domain_name: [''],
    range_low: new FormControl(null as number | null, [
      Validators.required,
      rangeValidator(minAllowedRange, maxAllowedRange),
    ]),
    range_high: new FormControl(null as number | null, [
      Validators.required,
      rangeValidator(minAllowedRange, maxAllowedRange),
    ]),
    certificate: new FormControl(null as number | null),
    schema_mode: new FormControl(null as IdmapSchemaMode | null),
    unix_primary_group: [false],
    unix_nss_info: [false],
    rangesize: new FormControl(null as number | null),
    readonly: [false],
    ignore_builtin: [false],
    ldap_base_dn: [''],
    ldap_user_dn: [''],
    ldap_user_dn_password: [''],
    ldap_url: [''],
    ssl: new FormControl(null as IdmapSslEncryptionMode | null),
    linked_service: new FormControl(null as IdmapLinkedService | null),
    ldap_server: [''],
    ldap_realm: [''],
    bind_path_user: [''],
    bind_path_group: [''],
    user_cn: [''],
    cn_realm: [''],
    ldap_domain: [''],
    sssd_compat: [false],
  }, {
    validators: [
      greaterThanFg(
        'range_high',
        ['range_low'],
        this.translate.instant('Value must be greater than Range Low'),
      ),
    ],
  });

  backendChoices: IdmapBackendOptions;
  protected isLoading = signal(false);

  readonly helptext = helptextIdmap;

  readonly editIdmapNames$ = of([
    { label: this.translate.instant('Active Directory - Primary Domain'), value: IdmapName.DsTypeActiveDirectory },
    { label: this.translate.instant('SMB - Primary Domain'), value: IdmapName.DsTypeDefaultDomain },
    { label: this.translate.instant('LDAP - Primary Domain'), value: IdmapName.DsTypeLdap },
    { label: this.translate.instant('Custom Value'), value: customIdmapName },
  ]);

  readonly createIdmapNames$ = of([
    { label: this.translate.instant('SMB - Primary Domain'), value: IdmapName.DsTypeDefaultDomain },
    { label: this.translate.instant('Custom Value'), value: customIdmapName },
  ]);

  readonly schemaModes$ = of([
    { label: 'RFC2307', value: IdmapSchemaMode.Rfc2307 },
    { label: 'SFU', value: IdmapSchemaMode.Sfu },
    { label: 'SFU20', value: IdmapSchemaMode.Sfu20 },
  ]);

  readonly sslModes$ = of([
    { label: this.translate.instant('Off'), value: IdmapSslEncryptionMode.Off },
    { label: this.translate.instant('On'), value: IdmapSslEncryptionMode.On },
    { label: 'StartTLS', value: IdmapSslEncryptionMode.StartTls },
  ]);

  readonly linkedServices$ = of([
    { label: this.translate.instant('Local Account'), value: IdmapLinkedService.LocalAccount },
    { label: 'LDAP', value: IdmapLinkedService.Ldap },
    { label: 'NIS', value: IdmapLinkedService.Nis },
  ]);

  certificates$ = this.idmapService.getCerts().pipe(idNameArrayToOptions());
  backends$: Observable<Option[]>;

  hasCertificateField$ = this.form.select((values) => {
    return values.idmap_backend === IdmapBackend.Ldap
      || values.idmap_backend === IdmapBackend.Rfc2307;
  });

  hasBackendField$ = this.form.select((values) => {
    return values.name !== IdmapName.DsTypeDefaultDomain;
  });

  get isCustomName(): boolean {
    return this.form.controls.name.value === customIdmapName;
  }

  get currentBackend(): IdmapBackendOption {
    return this.backendChoices?.[this.form.controls.idmap_backend.value];
  }

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private api: ApiService,
    private validationHelpers: IxValidatorsService,
    private idmapService: IdmapService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<Idmap | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.existingIdmap = slideInRef.getData();
  }

  ngOnInit(): void {
    this.loadBackendChoices();
    this.setFormDependencies();

    if (this.existingIdmap) {
      this.setIdmapForEdit(this.existingIdmap);
    }
  }

  setIdmapForEdit(idmap: Idmap): void {
    this.setEditingIdmapFormValues(idmap);
    this.form.controls.name.disable();
  }

  isOptionVisible(option: keyof IdmapFormComponent['form']['value']): boolean {
    const backend = this.currentBackend;
    if (!backend) {
      return false;
    }

    return Object.keys(backend.parameters).includes(option);
  }

  isOptionRequired(option: keyof IdmapFormComponent['form']['value']): boolean {
    const backend = this.currentBackend;
    if (!backend) {
      return false;
    }

    return backend.parameters[option].required;
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const params = this.prepareSubmitParams();

    const request$ = this.existingIdmap
      ? this.api.call('idmap.update', [this.existingIdmap.id, params])
      : this.api.call('idmap.create', [params]);

    request$
      .pipe(
        switchMap(() => this.askAndClearCache()),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.isLoading.set(false);
        },
      });
  }

  private loadBackendChoices(): void {
    this.isLoading.set(true);

    this.idmapService.getBackendChoices()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (backendChoices) => {
          this.isLoading.set(false);
          this.backendChoices = backendChoices;
          this.backends$ = of(Object.keys(backendChoices).map((backend) => ({
            label: backend,
            value: backend,
          })));

          if (!this.existingIdmap) {
            this.setDefaultsForBackendOptions();
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private setFormDependencies(): void {
    this.form.controls.idmap_backend.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.setDefaultsForBackendOptions());

    this.form.controls.name.valueChanges
      .pipe(
        filter((name) => name === IdmapName.DsTypeDefaultDomain),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.form.patchValue({
          idmap_backend: IdmapBackend.Tdb,
        });
      });
  }

  private setDefaultsForBackendOptions(): void {
    if (!this.currentBackend) {
      return;
    }

    Object.entries(this.currentBackend.parameters).forEach(([option, parameter]) => {
      this.form.patchValue({
        [option]: parameter.default,
      });
    });
  }

  private setEditingIdmapFormValues(idmap: Idmap): void {
    const hasCustomName = !requiredIdmapDomains.includes(idmap.name as IdmapName);

    this.form.patchValue({
      ...idmap,
      name: hasCustomName ? customIdmapName : idmap.name as IdmapName,
      certificate: idmap.certificate?.id,
    });

    if (hasCustomName) {
      this.form.patchValue({
        custom_name: idmap.name,
      });
    }

    Object.entries(idmap.options).forEach(([option, value]) => {
      this.form.patchValue({
        [option]: value,
      });
    });
  }

  private askAndClearCache(): Observable<unknown> {
    return this.dialogService.confirm({
      title: helptextIdmap.idmap.clear_cache_dialog.title,
      message: helptextIdmap.idmap.clear_cache_dialog.message,
      hideCheckbox: true,
    }).pipe(
      switchMap((confirmed) => {
        if (!confirmed) {
          return of(null);
        }

        return this.dialogService.jobDialog(
          this.api.job('idmap.clear_idmap_cache'),
          {
            title: this.translate.instant(helptextIdmap.idmap.clear_cache_dialog.job_title),
          },
        )
          .afterClosed()
          .pipe(
            tap(() => {
              this.snackbar.success(
                this.translate.instant(helptextIdmap.idmap.clear_cache_dialog.success_msg),
              );
            }),
          );
      }),
    );
  }

  private prepareSubmitParams(): IdmapUpdate {
    const values = this.form.value;
    const params = {
      name: values.name,
      range_high: values.range_high,
      range_low: values.range_low,
      idmap_backend: values.idmap_backend,
      options: {},
    } as IdmapUpdate;

    if (values.dns_domain_name) {
      params.dns_domain_name = values.dns_domain_name;
    }

    if (this.isCustomName) {
      params.name = values.custom_name;
    }

    if (values.certificate) {
      params.certificate = values.certificate;
    }

    Object.keys(this.currentBackend.parameters).forEach((option) => {
      const value = values[option as keyof IdmapFormComponent['form']['value']] as string;
      if (!value) {
        return;
      }

      params.options[option] = value;
    });

    return params;
  }
}
