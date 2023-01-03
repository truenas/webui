import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import {
  IdmapBackend, IdmapLinkedService, IdmapName, IdmapSchemaMode, IdmapSslEncryptionMode,
} from 'app/enums/idmap.enum';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/directory-service/idmap';
import { IdmapBackendOption, IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { Idmap, IdmapUpdate } from 'app/interfaces/idmap.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import {
  DialogService, IdmapService, ValidationService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const minAllowedRange = 1000;
const maxAllowedRange = 2147483647;
const customIdmapName = 'custom' as const;

@UntilDestroy()
@Component({
  templateUrl: './idmap-form.component.html',
  styleUrls: ['./idmap-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdmapFormComponent implements OnInit {
  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Idmap')
      : this.translate.instant('Edit Idmap');
  }

  get isNew(): boolean {
    return !this.existingIdmap;
  }

  form = this.formBuilder.group({
    idmap_backend: [IdmapBackend.Ad],
    name: [null as IdmapName | typeof customIdmapName, Validators.required],
    custom_name: ['', this.validationHelpers.validateOnCondition(
      (control) => control.parent?.value.name === customIdmapName,
      Validators.required,
    )],
    dns_domain_name: [''],
    range_low: [null as number, [
      Validators.required,
      this.validators.rangeValidator(minAllowedRange, maxAllowedRange),
    ]],
    range_high: [null as number, [
      Validators.required,
      this.validators.rangeValidator(minAllowedRange, maxAllowedRange),
      this.validators.greaterThan('range_low', [this.translate.instant('Range Low')]),
    ]],
    certificate: [null as number],
    schema_mode: [null as IdmapSchemaMode],
    unix_primary_group: [false],
    unix_nss_info: [false],
    rangesize: [null as number],
    readonly: [false],
    ignore_builtin: [false],
    ldap_base_dn: [''],
    ldap_user_dn: [''],
    ldap_user_dn_password: [''],
    ldap_url: [''],
    ssl: [null as IdmapSslEncryptionMode],
    linked_service: [null as IdmapLinkedService],
    ldap_server: [''],
    ldap_realm: [''],
    bind_path_user: [''],
    bind_path_group: [''],
    user_cn: [''],
    cn_realm: [''],
    ldap_domain: [''],
    sssd_compat: [false],
  });

  backendChoices: IdmapBackendOptions;
  existingIdmap: Idmap;
  isLoading = false;

  readonly helptext = helptext;

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
    return this.form.get('name').value === customIdmapName;
  }

  get currentBackend(): IdmapBackendOption {
    return this.backendChoices?.[this.form.get('idmap_backend').value];
  }

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private validationHelpers: IxValidatorsService,
    private validators: ValidationService,
    private idmapService: IdmapService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private slideInService: IxSlideInService,
    private router: Router,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadBackendChoices();
    this.setFormDependencies();
  }

  setIdmapForEdit(idmap: Idmap): void {
    this.existingIdmap = idmap;
    this.setEditingIdmapFormValues();
    this.form.controls['name'].disable();
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
    this.isLoading = true;

    const params = this.prepareSubmitParams();

    const request$ = this.isNew
      ? this.ws.call('idmap.create', [params])
      : this.ws.call('idmap.update', [this.existingIdmap.id, params]);

    request$
      .pipe(
        switchMap(() => this.askAndClearCache()),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInService.close();
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  certificatesLinkClicked(): void {
    this.slideInService.close();
    this.router.navigate(['/', 'credentials', 'certificates']);
  }

  private loadBackendChoices(): void {
    this.isLoading = true;

    this.idmapService.getBackendChoices()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (backendChoices) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.backendChoices = backendChoices;
          this.backends$ = of(Object.keys(backendChoices).map((backend) => ({
            label: backend,
            value: backend,
          })));

          if (!this.existingIdmap) {
            this.setDefaultsForBackendOptions();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(this, error);
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

  private setEditingIdmapFormValues(): void {
    const hasCustomName = !requiredIdmapDomains.includes(this.existingIdmap.name as IdmapName);

    this.form.patchValue({
      ...this.existingIdmap,
      name: hasCustomName ? customIdmapName : this.existingIdmap.name as IdmapName,
      certificate: this.existingIdmap.certificate?.id,
    });

    if (hasCustomName) {
      this.form.patchValue({
        custom_name: this.existingIdmap.name,
      });
    }

    Object.entries(this.existingIdmap.options).forEach(([option, value]) => {
      this.form.patchValue({
        [option]: value,
      });
    });
  }

  private askAndClearCache(): Observable<unknown> {
    return this.dialogService.confirm({
      title: helptext.idmap.clear_cache_dialog.title,
      message: helptext.idmap.clear_cache_dialog.message,
      hideCheckBox: true,
    }).pipe(
      switchMap((confirmed) => {
        if (!confirmed) {
          return of(null);
        }

        const dialog = this.matDialog.open(EntityJobComponent, {
          data: { title: helptext.idmap.clear_cache_dialog.job_title },
          disableClose: true,
        });
        dialog.componentInstance.setCall('idmap.clear_idmap_cache');
        dialog.componentInstance.submit();
        dialog.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.snackbar.success(
            this.translate.instant(helptext.idmap.clear_cache_dialog.success_msg),
          );
          dialog.close();
        });

        return dialog.afterClosed();
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
      params['dns_domain_name'] = values.dns_domain_name;
    }

    if (this.isCustomName) {
      params['name'] = values.custom_name;
    }

    if (values.certificate) {
      params['certificate'] = values.certificate;
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
