import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/directory-service/active-directory';
import global_helptext from 'app/helptext/global-helptext';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { ActiveDirectoryUpdate } from 'app/interfaces/active-directory.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { ActiveDirectoryConfigUi } from 'app/pages/directory-service/components/active-directory/active-directory-config-ui.interface';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-activedirectory',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ActiveDirectoryComponent implements FormConfiguration {
  title = this.translate.instant(helptext.title);
  queryCall = 'activedirectory.config' as const;
  updateCall = 'activedirectory.update' as const;
  isEntity = false;
  isBasicMode = true;
  protected kerberosRealmField: FormSelectConfig;
  protected kerberosPrincipalField: FormSelectConfig;
  protected nssInfoField: FormSelectConfig;
  adStatus = false;
  entityEdit: EntityFormComponent;
  custActions = [
    {
      id: helptext.activedirectory_custactions_basic_id,
      name: global_helptext.basic_options,
      function: () => {
        this.isBasicMode = true;
      },
    },
    {
      id: helptext.activedirectory_custactions_advanced_id,
      name: global_helptext.advanced_options,
      function: () => {
        this.isBasicMode = false;
      },
    },
    {
      id: helptext.activedirectory_custactions_clearcache_id,
      name: helptext.activedirectory_custactions_clearcache_name,
      function: () => {
        this.systemGeneralService.refreshDirServicesCache().pipe(untilDestroyed(this)).subscribe(() => {
          this.dialogservice.info(helptext.activedirectory_custactions_clearcache_dialog_title,
            helptext.activedirectory_custactions_clearcache_dialog_message);
        });
      },
    },
    {
      id: 'leave_domain',
      name: helptext.activedirectory_custactions_leave_domain,
      function: () => {
        this.dialogservice.dialogForm(
          {
            title: helptext.activedirectory_custactions_leave_domain,
            fieldConfig: [
              {
                type: 'paragraph',
                name: 'message',
                paraText: helptext.ad_leave_domain_dialog.message,
              },
              {
                type: 'input',
                name: 'username',
                placeholder: helptext.ad_leave_domain_dialog.username,
                required: true,
              },
              {
                type: 'input',
                name: 'password',
                placeholder: helptext.ad_leave_domain_dialog.pw,
                inputType: 'password',
                togglePw: true,
                required: true,
              },
            ],
            saveButtonText: helptext.activedirectory_custactions_leave_domain,
            customSubmit: (entityDialog: EntityDialogComponent) => {
              const value = entityDialog.formValue;
              entityDialog.loader.open();
              this.ws.job('activedirectory.leave', [{ username: value.username, password: value.password }])
                .pipe(untilDestroyed(this)).subscribe((job) => {
                  if (job.state !== JobState.Success) {
                    return;
                  }

                  entityDialog.loader.close();
                  entityDialog.dialogRef.close(true);
                  _.find(this.fieldConfig, { name: 'enable' })['value'] = false;
                  this.entityEdit.formGroup.controls['enable'].setValue(false);
                  this.adStatus = false;
                  this.isCustActionVisible('leave_domain');
                  this.modalService.refreshTable();
                  this.modalService.closeSlideIn();
                  this.dialogservice.info(helptext.ad_leave_domain_dialog.success,
                    helptext.ad_leave_domain_dialog.success_msg, '400px', 'info', true);
                },
                (err: WebsocketError) => {
                  entityDialog.loader.close();
                  new EntityUtils().handleWsError(helptext.ad_leave_domain_dialog.error, err, this.dialogservice);
                });
            },
          },
        );
      },
    },
  ];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.ad_section_headers.dc,
      class: 'section_header',
      label: false,
      config: [
        {
          type: 'input',
          name: helptext.activedirectory_domainname_name,
          placeholder: helptext.activedirectory_domainname_placeholder,
          tooltip: helptext.activedirectory_domainname_tooltip,
          required: true,
          validation: helptext.activedirectory_domainname_validation,
        },
        {
          type: 'input',
          name: helptext.activedirectory_bindname_name,
          placeholder: helptext.activedirectory_bindname_placeholder,
          tooltip: helptext.activedirectory_bindname_tooltip,
          required: true,
          validation: helptext.activedirectory_bindname_validation,
          disabled: false,
          isHidden: true,
        },
        {
          type: 'input',
          inputType: 'password',
          name: helptext.activedirectory_bindpw_name,
          placeholder: helptext.activedirectory_bindpw_placeholder,
          tooltip: helptext.activedirectory_bindpw_tooltip,
          togglePw: true,
          disabled: false,
          isHidden: false,
        },
        {
          type: 'checkbox',
          name: helptext.activedirectory_enable_name,
          placeholder: helptext.activedirectory_enable_placeholder,
          tooltip: helptext.activedirectory_enable_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.activedirectory_verbose_logging_name,
          placeholder: helptext.activedirectory_verbose_logging_placeholder,
          tooltip: helptext.activedirectory_verbose_logging_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.activedirectory_trusted_doms_name,
          placeholder: helptext.activedirectory_trusted_doms_placeholder,
          tooltip: helptext.activedirectory_trusted_doms_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.activedirectory_default_dom_name,
          placeholder: helptext.activedirectory_default_dom_placeholder,
          tooltip: helptext.activedirectory_default_dom_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.activedirectory_dns_updates_name,
          placeholder: helptext.activedirectory_dns_updates_placeholder,
          tooltip: helptext.activedirectory_dns_updates_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.activedirectory_disable_fn_cache_name,
          placeholder: helptext.activedirectory_disable_fn_cache_placeholder,
          tooltip: helptext.activedirectory_disable_fn_cache_tooltip,
        },
        {
          type: 'checkbox',
          name: 'restrict_pam',
          placeholder: helptext.restrict_pam.placeholder,
          tooltip: helptext.restrict_pam.tooltip,
        },
      ],
    },
    {
      name: helptext.ad_section_headers.advanced_col1,
      class: 'adv_column1',
      label: false,
      config: [
        {
          type: 'input',
          name: helptext.activedirectory_site_name,
          placeholder: helptext.activedirectory_site_placeholder,
          tooltip: helptext.activedirectory_site_tooltip,
        },
        {
          type: 'select',
          name: helptext.activedirectory_kerberos_realm_name,
          placeholder: helptext.activedirectory_kerberos_realm_placeholder,
          tooltip: helptext.activedirectory_kerberos_realm_tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'select',
          name: helptext.activedirectory_kerberos_principal_name,
          placeholder: helptext.activedirectory_kerberos_principal_placeholder,
          tooltip: helptext.activedirectory_kerberos_principal_tooltip,
          options: [
            { label: '---', value: null },
          ],
        },
        {
          type: 'input',
          name: helptext.computer_account_OU_name,
          placeholder: helptext.computer_account_OU_placeholder,
          tooltip: helptext.computer_account_OU_tooltip,
        },
        {
          type: 'input',
          name: helptext.activedirectory_timeout_name,
          placeholder: helptext.activedirectory_timeout_placeholder,
          tooltip: helptext.activedirectory_timeout_tooltip,
        },
        {
          type: 'input',
          name: helptext.activedirectory_dns_timeout_name,
          placeholder: helptext.activedirectory_dns_timeout_placeholder,
          tooltip: helptext.activedirectory_dns_timeout_tooltip,
        },
        {
          type: 'select',
          name: helptext.activedirectory_nss_info_name,
          placeholder: helptext.activedirectory_nss_info_placeholder,
          tooltip: helptext.activedirectory_nss_info_tooltip,
          options: [],
        },
        {
          type: 'input',
          name: helptext.activedirectory_netbiosname_a_name,
          placeholder: helptext.activedirectory_netbiosname_a_placeholder,
          tooltip: helptext.activedirectory_netbiosname_a_tooltip,
          validation: helptext.activedirectory_netbiosname_a_validation,
          required: true,
        },
        {
          type: 'input',
          name: helptext.activedirectory_netbiosname_b_name,
          placeholder: helptext.activedirectory_netbiosname_b_placeholder,
          tooltip: helptext.activedirectory_netbiosname_b_tooltip,
          validation: helptext.activedirectory_netbiosname_b_validation,
          required: true,
          isHidden: true,
          disabled: true,
        },
        {
          type: 'input',
          name: helptext.activedirectory_netbiosalias_name,
          placeholder: helptext.activedirectory_netbiosalias_placeholder,
          tooltip: helptext.activedirectory_netbiosalias_tooltip,
        },
      ],
    },
  ];

  advancedFields = helptext.activedirectory_advanced_fields;

  isCustActionVisible(actionname: string): boolean {
    if (actionname === 'advanced_mode' && !this.isBasicMode) {
      return false;
    } if (actionname === 'basic_mode' && this.isBasicMode) {
      return false;
    } if (actionname === 'leave_domain' && this.isBasicMode) {
      return false;
    } if (actionname === 'leave_domain' && !this.adStatus) {
      return false;
    }
    return true;
  }

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    private modalService: ModalService,
    protected dialog: MatDialog,
    protected systemGeneralService: SystemGeneralService,
    protected dialogservice: DialogService,
    protected translate: TranslateService,
  ) { }

  resourceTransformIncomingRestData(data: ActiveDirectoryConfig): ActiveDirectoryConfigUi {
    const transformed: ActiveDirectoryConfigUi = {
      ...data,
      netbiosalias: data.netbiosalias.join(' '),
      kerberos_realm: null,
    };
    if (data['kerberos_realm'] && data['kerberos_realm'] !== null) {
      transformed['kerberos_realm'] = data['kerberos_realm'].id;
    }
    delete transformed['bindpw'];
    return transformed;
  }

  preInit(entityForm: EntityFormComponent): void {
    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.licensed').pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('smb.get_smb_ha_mode')),
        untilDestroyed(this),
      ).subscribe((haMode) => {
        if (haMode !== 'LEGACY') {
          return;
        }

        entityForm.setDisabled('netbiosname_b', false, false);
      });
    }
    this.ws.call('directoryservices.get_state').pipe(untilDestroyed(this)).subscribe((res) => {
      this.adStatus = res.activedirectory === DirectoryServiceState.Healthy;
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
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

    this.ws.call('activedirectory.nss_info_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      this.nssInfoField = _.find(this.fieldConfig, { name: 'nss_info' }) as FormSelectConfig;
      choices.forEach((choice) => {
        this.nssInfoField.options.push(
          { label: choice, value: choice },
        );
      });
    });

    entityEdit.formGroup.controls['enable'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      _.find(this.fieldConfig, { name: 'bindpw' })['required'] = res;
    });

    entityEdit.formGroup.controls['kerberos_principal'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      if (res) {
        entityEdit.setDisabled('bindname', true);
        entityEdit.setDisabled('bindpw', true);
        _.find(this.fieldConfig, { name: 'bindname' })['isHidden'] = true;
        _.find(this.fieldConfig, { name: 'bindpw' })['isHidden'] = true;
      } else {
        entityEdit.setDisabled('bindname', false);
        entityEdit.setDisabled('bindpw', false);
        _.find(this.fieldConfig, { name: 'bindname' })['isHidden'] = false;
        _.find(this.fieldConfig, { name: 'bindpw' })['isHidden'] = false;
      }
    });

    entityEdit.submitFunction = this.submitFunction;
  }

  beforeSubmit(data: any): void {
    data.netbiosalias = data.netbiosalias.trim();
    if (data.netbiosalias.length > 0) {
      data.netbiosalias = data.netbiosalias.split(' ');
    } else {
      data.netbiosalias = [];
    }
    if (data.kerberos_principal) {
      data.bindpw = '';
    }
    data['site'] = data['site'] === null ? '' : data['site'];

    if (data.kerberos_principal === null) {
      data.kerberos_principal = '';
    }

    const allowedNullValues = ['certificate', 'kerberos_realm'];
    for (const i in data) {
      if (!allowedNullValues.includes(i) && data[i] === null) {
        delete data[i];
      }
    }
  }

  submitFunction(body: ActiveDirectoryUpdate): Observable<ActiveDirectoryConfig> {
    return this.ws.call('activedirectory.update', [body]);
  }

  responseOnSubmit(value: ActiveDirectoryConfig & { job_id?: number }): void {
    this.entityEdit.formGroup.controls['kerberos_principal'].setValue(value.kerberos_principal);
    this.entityEdit.formGroup.controls['kerberos_realm'].setValue(value['kerberos_realm']);

    if (value.enable) {
      this.adStatus = true;
    }

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
      this.kerberosPrincipalField.options.length = 0;
      this.kerberosPrincipalField.options.push({ label: '---', value: null });
      res.forEach((item) => {
        this.kerberosPrincipalField.options.push(
          { label: item, value: item },
        );
      });
    });

    if (value.job_id) {
      this.showStartingJob(value.job_id);
    }
  }

  // Shows starting progress as a job dialog
  showStartingJob(jobId: number): void {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Start') }, disableClose: true });
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.modalService.refreshTable();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      new EntityUtils().handleWsError(this, error, this.dialogservice);
      this.modalService.refreshTable();
      dialogRef.close();
    });
  }
}
