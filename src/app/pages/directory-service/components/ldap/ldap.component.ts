import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/directory-service/ldap';
import global_helptext from 'app/helptext/global-helptext';
import { FormConfiguration, FormCustomAction } from 'app/interfaces/entity-form.interface';
import { LdapConfig, LdapConfigUpdate, LdapConfigUpdateResult } from 'app/interfaces/ldap-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormSelectConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { LdapTransformedConfig } from 'app/pages/directory-service/components/ldap/ldap-transformed-config.interface';
import {
  SystemGeneralService,
  WebSocketService,
  DialogService,
  AppLoaderService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-ldap',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class LdapComponent implements FormConfiguration {
  title = this.translate.instant(helptext.title);
  isEntity = false;
  queryCall = 'ldap.config' as const;
  updateCall = 'ldap.update' as const;
  isBasicMode = true;
  protected kerberosRealmField: FormSelectConfig;
  protected kerberosPrincipalField: FormSelectConfig;
  protected ldapSslField: FormSelectConfig;
  protected ldapCertificateField: FormSelectConfig;
  protected ldapSchemaField: FormSelectConfig;
  protected hostnames: string[];
  protected entityForm: EntityFormComponent;
  customActions: FormCustomAction[] = [
    {
      id: helptext.ldap_custactions_basic_id,
      name: global_helptext.basic_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      },
    },
    {
      id: helptext.ldap_custactions_advanced_id,
      name: global_helptext.advanced_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      },
    },
    {
      id: helptext.ldap_custactions_clearcache_id,
      name: helptext.ldap_custactions_clearcache_name,
      function: () => {
        this.systemGeneralService.refreshDirServicesCache().pipe(untilDestroyed(this)).subscribe(() => {
          this.dialogService.info(helptext.ldap_custactions_clearcache_dialog_title,
            helptext.ldap_custactions_clearcache_dialog_message);
        });
      },
    },
  ];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.ldap_server_creds,
      class: 'section_header',
      label: false,
      config: [
        {
          type: 'chip',
          name: helptext.ldap_hostname_name,
          placeholder: helptext.ldap_hostname_placeholder,
          tooltip: helptext.ldap_hostname_tooltip,
          required: true,
          validation: helptext.ldap_hostname_validation,
        },
        {
          type: 'chip',
          name: helptext.ldap_hostname_noreq_name,
          placeholder: helptext.ldap_hostname_noreq_placeholder,
          tooltip: helptext.ldap_hostname_noreq_tooltip,
        },
        {
          type: 'input',
          name: helptext.ldap_basedn_name,
          placeholder: helptext.ldap_basedn_placeholder,
          tooltip: helptext.ldap_basedn_tooltip,
        },
        {
          type: 'input',
          name: helptext.ldap_binddn_name,
          placeholder: helptext.ldap_binddn_placeholder,
          tooltip: helptext.ldap_binddn_tooltip,
        },
        {
          type: 'input',
          name: helptext.ldap_bindpw_name,
          placeholder: helptext.ldap_bindpw_placeholder,
          tooltip: helptext.ldap_bindpw_tooltip,
          inputType: 'password',
          togglePw: true,
        },
        {
          type: 'checkbox',
          name: helptext.ldap_enable_name,
          placeholder: helptext.ldap_enable_placeholder,
          tooltip: helptext.ldap_enable_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.ldap_anonbind_name,
          placeholder: helptext.ldap_anonbind_placeholder,
          tooltip: helptext.ldap_anonbind_tooltip,
        },
        {
          type: 'select',
          name: helptext.ldap_ssl_name,
          placeholder: helptext.ldap_ssl_placeholder,
          tooltip: helptext.ldap_ssl_tooltip,
          options: [],
        },
        {
          type: 'select',
          name: helptext.ldap_certificate_name,
          placeholder: helptext.ldap_certificate_placeholder,
          tooltip: helptext.ldap_certificate_tooltip,
          options: [{ label: '---', value: null }],
          linkText: 'Certificates',
          linkClicked: () => {
            this.modalService.closeSlideIn().then(() => {
              this.router.navigate(['/', 'credentials', 'certificates']);
            });
          },
        },
        {
          type: 'checkbox',
          name: 'validate_certificates',
          placeholder: helptext.ldap_validate_certificates_placeholder,
          tooltip: helptext.ldap_validate_certificates_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.ldap_disable_fn_cache_name,
          placeholder: helptext.ldap_disable_fn_cache_placeholder,
          tooltip: helptext.ldap_disable_fn_cache_tooltip,
        },
      ],
    },
    {
      name: 'section_two',
      class: 'section_header',
      label: false,
      config: [

        {
          type: 'select',
          name: helptext.ldap_kerberos_realm_name,
          placeholder: helptext.ldap_kerberos_realm_placeholder,
          tooltip: helptext.ldap_kerberos_realm_tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'select',
          name: helptext.ldap_kerberos_principal_name,
          placeholder: helptext.ldap_kerberos_principal_placeholder,
          tooltip: helptext.ldap_kerberos_principal_tooltip,
          options: [{ label: '---', value: '' }],
        },
        {
          type: 'input',
          name: helptext.ldap_timeout_name,
          placeholder: helptext.ldap_timeout_placeholder,
          tooltip: helptext.ldap_timeout_tooltip,
        },
        {
          type: 'input',
          name: helptext.ldap_dns_timeout_name,
          placeholder: helptext.ldap_dns_timeout_placeholder,
          tooltip: helptext.ldap_dns_timeout_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.ldap_has_samba_schema_name,
          placeholder: helptext.ldap_has_samba_schema_placeholder,
          tooltip: helptext.ldap_has_samba_schema_tooltip,
        },
        {
          type: 'textarea',
          name: helptext.ldap_auxiliary_parameters_name,
          placeholder: helptext.ldap_auxiliary_parameters_placeholder,
          tooltip: helptext.ldap_auxiliary_parameters_tooltip,
        },
        {
          type: 'select',
          name: helptext.ldap_schema_name,
          placeholder: helptext.ldap_schema_placeholder,
          tooltip: helptext.ldap_schema_tooltip,
          options: [],
        },
      ],
    },
  ];

  advancedFields = helptext.ldap_advanced_fields;

  isCustomActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && !this.isBasicMode) {
      return false;
    } if (actionId === 'basic_mode' && this.isBasicMode) {
      return false;
    } if (actionId === 'edit_idmap' && this.isBasicMode) {
      return false;
    }
    return true;
  }

  constructor(
    private router: Router,
    private ws: WebSocketService,
    private modalService: ModalService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private loader: AppLoaderService,
    private systemGeneralService: SystemGeneralService,
    private translate: TranslateService,
  ) { }

  resourceTransformIncomingRestData(data: LdapConfig): LdapTransformedConfig {
    const transformed = {
      ...data,
      hostname_noreq: data['hostname'],
    };
    delete transformed['bindpw'];
    this.hostnames = data['hostname'];
    return transformed;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;

    this.ws.call('kerberos.realm.query').pipe(untilDestroyed(this)).subscribe((realms) => {
      this.kerberosRealmField = _.find(this.fieldConfig, { name: 'kerberos_realm' }) as FormSelectConfig;
      realms.forEach((realm) => {
        this.kerberosRealmField.options.push(
          { label: realm.realm, value: realm.id },
        );
      });
    });

    this.ws.call('kerberos.keytab.kerberos_principal_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      this.kerberosPrincipalField = _.find(this.fieldConfig, { name: 'kerberos_principal' }) as FormSelectConfig;
      res.forEach((item) => {
        this.kerberosPrincipalField.options.push(
          { label: item, value: item },
        );
      });
    });

    this.ws.call('ldap.ssl_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      this.ldapSslField = _.find(this.fieldConfig, { name: 'ssl' }) as FormSelectConfig;
      choices.forEach((item) => {
        this.ldapSslField.options.push(
          { label: item, value: item },
        );
      });
    });

    this.systemGeneralService.getCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
      this.ldapCertificateField = _.find(this.fieldConfig, { name: 'certificate' }) as FormSelectConfig;
      res.forEach((item) => {
        this.ldapCertificateField.options.push(
          { label: item.name, value: item.id },
        );
      });

      // Handle case when there is no data
      if (res.length === 0) {
        this.ldapCertificateField.zeroStateMessage = 'No Certificates Found';
      }
    });

    this.ws.call('ldap.schema_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      this.ldapSchemaField = _.find(this.fieldConfig, { name: 'schema' }) as FormSelectConfig;
      res.forEach(((item) => {
        this.ldapSchemaField.options.push(
          { label: item, value: item },
        );
      }));
    });

    const enabled = entityEdit.formGroup.controls['enable'].value;
    this.entityForm.setDisabled('hostname', !enabled, !enabled);
    this.entityForm.setDisabled('hostname_noreq', enabled, enabled);
    entityEdit.formGroup.controls['enable'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      this.entityForm.setDisabled('hostname', !res, !res);
      this.entityForm.setDisabled('hostname_noreq', res, res);
      if (!res) {
        this.entityForm.formGroup.controls['hostname_noreq'].setValue(this.entityForm.formGroup.controls['hostname'].value);
      } else {
        this.entityForm.formGroup.controls['hostname'].setValue(this.entityForm.formGroup.controls['hostname_noreq'].value);
      }
    });
    entityEdit.submitFunction = this.submitFunction;
    setTimeout(() => {
      this.entityForm.formGroup.controls['hostname'].setValue(this.hostnames);
    }, 500);
  }

  beforeSubmit(data: any): void {
    if (data['enable']) {
      data['hostname_noreq'] = data['hostname'];
    } else {
      data['hostname'] = data['hostname_noreq'];
    }
    delete (data['hostname_noreq']);
  }

  submitFunction(body: LdapConfigUpdate): Observable<LdapConfig> {
    return this.ws.call('ldap.update', [body]);
  }

  afterSubmit(): void {
    this.modalService.refreshTable();
  }

  errorReport(res: WebsocketError): void {
    let errorText = res.reason ? res.reason.replace('[EFAULT]', '') : null;
    if (res.reason && res.reason.includes('Invalid credentials')) {
      errorText = this.translate.instant('Invalid credentials. Please try again.');
    }
    this.entityForm.error = errorText;
  }

  responseOnSubmit(result: LdapConfigUpdateResult): void {
    if (result.job_id) {
      this.showUpdateJob(result.job_id);
    }
  }

  showUpdateJob(jobId: number): void {
    const dialogRef = this.matDialog.open(
      EntityJobComponent,
      {
        data: { title: this.translate.instant('Setting up LDAP') },
        disableClose: true,
      },
    );
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.modalService.refreshTable();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      new EntityUtils().handleWsError(this, error, this.dialogService);
      this.modalService.refreshTable();
      dialogRef.close();
    });
  }
}
