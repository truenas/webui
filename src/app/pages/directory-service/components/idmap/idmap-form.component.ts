import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IdmapName } from 'app/enums/idmap-name.enum';
import helptext from 'app/helptext/directory-service/idmap';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { ValidationService, IdmapService, DialogService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-idmap-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class IdmapFormComponent implements FormConfiguration {
  title: string;
  isEntity = true;
  protected namesInUse: string[] = [];
  queryCall = 'idmap.query' as const;
  addCall = 'idmap.create' as const;
  editCall = 'idmap.update' as const;
  pk: number;
  queryKey = 'id';
  private getRow = new Subscription();
  rangeLowValidation = [
    ...helptext.idmap.required_validator,
    this.validationService.rangeValidator(1000, 2147483647),
  ];
  rangeHighValidation = [
    ...helptext.idmap.required_validator,
    this.validationService.rangeValidator(1000, 2147483647),
    this.validationService.greaterThan('range_low', [helptext.idmap.range_low.placeholder]),
  ];
  private entityForm: EntityFormComponent;
  protected backendChoices: IdmapBackendOptions;
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  protected requiredDomains = [
    IdmapName.DsTypeActiveDirectory,
    IdmapName.DsTypeDefaultDomain,
    IdmapName.DsTypeLdap,
  ];
  protected readOnly = false;
  fieldConfig: FieldConfig[] = [];
  protected isOneColumnForm = true;
  fieldSetDisplay = 'default';
  fieldSets: FieldSet[] = [
    {
      name: helptext.idmap.settings_label,
      class: 'idmap-configuration-form',
      colspan: 2,
      label: false,
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'idmap_backend',
          placeholder: helptext.idmap.idmap_backend.placeholder,
          tooltip: helptext.idmap.idmap_backend.tooltip,
          options: [],
        },
        {
          type: 'select',
          name: 'name',
          placeholder: helptext.idmap.name.placeholder,
          tooltip: helptext.idmap.name.tooltip,
          required: true,
          options: helptext.idmap.name.options,
        },
        {
          type: 'input',
          name: 'custom_name',
          placeholder: helptext.idmap.custom_name.placeholder,
          tooltip: helptext.idmap.custom_name.tooltip,
          required: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'name',
                value: 'custom',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'dns_domain_name',
          placeholder: helptext.idmap.dns_domain_name.placeholder,
          tooltip: helptext.idmap.dns_domain_name.tooltip,
        },
        {
          type: 'input',
          name: 'range_low',
          inputType: 'number',
          placeholder: helptext.idmap.range_low.placeholder,
          tooltip: helptext.idmap.range_tooltip,
          validation: this.rangeLowValidation,
          required: true,
        },
        {
          type: 'input',
          name: 'range_high',
          inputType: 'number',
          placeholder: helptext.idmap.range_high.placeholder,
          tooltip: helptext.idmap.range_tooltip,
          validation: this.rangeHighValidation,
          required: true,
        },
        {
          type: 'select',
          name: 'certificate',
          placeholder: 'Rehan Cert', // helptext.idmap.certificate_id.placeholder,
          tooltip: helptext.idmap.certificate_id.tooltip,
          options: [],
          linkText: this.translate.instant('Certificates'),
          linkClicked: () => {
            this.modalService.closeSlideIn().then(() => {
              this.router.navigate(['/', 'credentials', 'certificates']);
            });
          },
          isHidden: true,
        },
      ],
    },
    {
      name: helptext.idmap.options_label,
      class: 'idmap-configuration-form',
      label: true,
      colspan: 2,
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'schema_mode',
          placeholder: helptext.idmap.schema_mode.placeholder,
          tooltip: helptext.idmap.schema_mode.tooltip,
          options: helptext.idmap.schema_mode.options,
        },
        {
          type: 'checkbox',
          name: 'unix_primary_group',
          placeholder: helptext.idmap.unix_primary_group.placeholder,
          tooltip: helptext.idmap.unix_primary_group.tooltip,
        },
        {
          type: 'checkbox',
          name: 'unix_nss_info',
          placeholder: helptext.idmap.unix_nss.placeholder,
          tooltip: helptext.idmap.unix_nss.tooltip,
        },
        {
          type: 'input',
          name: 'rangesize',
          inputType: 'number',
          placeholder: helptext.idmap.rangesize.placeholder,
          tooltip: helptext.idmap.rangesize.tooltip,
        },
        {
          type: 'checkbox',
          name: 'readonly',
          placeholder: helptext.idmap.readonly.placeholder,
          tooltip: helptext.idmap.readonly.tooltip,
        },
        {
          type: 'checkbox',
          name: 'ignore_builtin',
          placeholder: helptext.idmap.ignore_builtin.placeholder,
          tooltip: helptext.idmap.ignore_builtin.tooltip,
        },
        {
          type: 'input',
          name: 'ldap_base_dn',
          placeholder: helptext.idmap.ldap_basedn.placeholder,
          tooltip: helptext.idmap.ldap_basedn.tooltip,
        },
        {
          type: 'input',
          name: 'ldap_user_dn',
          placeholder: helptext.idmap.ldap_userdn.placeholder,
          tooltip: helptext.idmap.ldap_userdn.tooltip,
        },
        {
          type: 'input',
          name: 'ldap_user_dn_password',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext.idmap.ldap_user_dn_password.placeholder,
          tooltip: helptext.idmap.ldap_user_dn_password.tooltip,
        },
        {
          type: 'input',
          name: 'ldap_url',
          placeholder: helptext.idmap.ldap_url.placeholder,
          tooltip: helptext.idmap.ldap_url.tooltip,
        },
        {
          type: 'select',
          name: 'ssl',
          placeholder: helptext.idmap.ssl.placeholder,
          tooltip: helptext.idmap.ssl.tooltip,
          options: helptext.idmap.ssl.options,
        },
        {
          type: 'select',
          name: 'linked_service',
          placeholder: helptext.idmap.linked_service.placeholder,
          tooltip: helptext.idmap.linked_service.tooltip,
          options: helptext.idmap.linked_service.options,
        },
        {
          type: 'input',
          name: 'ldap_server',
          placeholder: helptext.idmap.ldap_server.placeholder,
          tooltip: helptext.idmap.ldap_server.tooltip,
        },
        {
          type: 'input',
          name: 'ldap_realm',
          placeholder: helptext.idmap.ldap_realm.placeholder,
          tooltip: helptext.idmap.ldap_realm.tooltip,
        },
        {
          type: 'input',
          name: 'bind_path_user',
          placeholder: helptext.idmap.bind_path_user.placeholder,
          tooltip: helptext.idmap.bind_path_user.tooltip,
        },
        {
          type: 'input',
          name: 'bind_path_group',
          placeholder: helptext.idmap.bind_path_group.placeholder,
          tooltip: helptext.idmap.bind_path_group.tooltip,
        },
        {
          type: 'input',
          name: 'user_cn',
          placeholder: helptext.idmap.user_cn.placeholder,
          tooltip: helptext.idmap.user_cn.tooltip,
        },
        {
          type: 'input',
          name: 'cn_realm',
          placeholder: helptext.idmap.cn_realm.placeholder,
          tooltip: helptext.idmap.cn_realm.tooltip,
        },
        {
          type: 'input',
          name: 'ldap_domain',
          placeholder: helptext.idmap.ldap_domain.placeholder,
          tooltip: helptext.idmap.ldap_server.tooltip,
        },
        {
          type: 'checkbox',
          name: 'sssd_compat',
          placeholder: helptext.idmap.sssd_compat.placeholder,
          tooltip: helptext.idmap.sssd_compat.tooltip,
        },
      ],
    },
  ];

  private optionsFields = [
    'schema_mode',
    'unix_primary_group',
    'unix_nss_info',
    'rangesize',
    'readonly',
    'ignore_builtin',
    'ldap_base_dn',
    'ldap_user_dn',
    'ldap_user_dn_password',
    'ldap_url',
    'ssl',
    'linked_service',
    'ldap_server',
    'ldap_realm',
    'bind_path_user',
    'bind_path_group',
    'user_cn',
    'cn_realm',
    'ldap_domain',
    'sssd_compat',
  ];

  constructor(protected idmapService: IdmapService, protected validationService: ValidationService,
    private modalService: ModalService, private router: Router, private translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: number) => {
      this.pk = rowId;
      this.getRow.unsubscribe();
    });
  }

  resourceTransformIncomingRestData(data: any): any {
    for (const item in data.options) {
      data[item] = data.options[item];
    }
    if (data.certificate) {
      data.certificate = data.certificate.id;
    }
    this.readOnly = this.requiredDomains.includes(data.name);
    return data;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.title = entityEdit.isNew ? helptext.title_add : helptext.title_edit;
    this.entityForm = entityEdit;
    this.optionsFields.forEach((option) => {
      this.hideField(option, true, entityEdit);
    });

    this.idmapService.getCerts().pipe(untilDestroyed(this)).subscribe((certificates) => {
      const certificateConfig = this.fieldConfig.find((config) => config.name === 'certificate') as FormSelectConfig;
      certificateConfig.options.push({ label: '---', value: null });
      certificates.forEach((certificate) => {
        certificateConfig.options.push({ label: certificate.name, value: certificate.id });
      });
    });

    entityEdit.formGroup.controls['idmap_backend'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      this.optionsFields.forEach((option) => {
        this.hideField(option, true, entityEdit);
      });
      for (const i in this.backendChoices[value].parameters) {
        this.optionsFields.forEach((option) => {
          if (option === i) {
            const params = this.backendChoices[value].parameters[option];
            this.hideField(option, false, entityEdit);
            const field = _.find(this.fieldConfig, { name: option });
            field['required'] = params.required;
            entityEdit.formGroup.controls[option].setValue(params.default);
            if (value === 'LDAP' || value === 'RFC2307') {
              this.hideField('certificate', false, entityEdit);
            } else {
              this.hideField('certificate', true, entityEdit);
            }
          }
        });
      }
    });

    entityEdit.formGroup.controls['name'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: IdmapName) => {
      if (value === IdmapName.DsTypeDefaultDomain) {
        entityEdit.formGroup.controls['idmap_backend'].setValue('TDB');
        this.hideField('idmap_backend', true, entityEdit);
      } else if (_.find(this.fieldConfig, { name: 'idmap_backend' }).isHidden) {
        this.hideField('idmap_backend', false, entityEdit);
      }
    });

    this.idmapService.getBackendChoices().pipe(untilDestroyed(this)).subscribe((backendChoices) => {
      this.backendChoices = backendChoices;
      const idmapBackendConfig = this.fieldConfig.find((config) => config.name === 'idmap_backend') as FormSelectConfig;
      for (const item in backendChoices) {
        idmapBackendConfig.options.push({ label: item, value: item });
      }
      entityEdit.formGroup.controls['idmap_backend'].setValue('AD');
    });

    setTimeout(() => {
      if (this.readOnly) {
        entityEdit.setDisabled('name', true, false);
      }
    }, 500);
  }

  hideField(fieldName: string, show: boolean, entity: EntityFormComponent): void {
    const target = _.find(this.fieldConfig, { name: fieldName });
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

  beforeSubmit(data: any): void {
    if (data.dns_domain_name === null) {
      delete data.dns_domain_name;
    }
    if (data.custom_name) {
      data.name = data.custom_name;
      delete data.custom_name;
    }
    const options: Record<string, string> = {};
    for (const item in data) {
      if (this.optionsFields.includes(item)) {
        if (data[item]) {
          options[item] = data[item];
        }
        delete data[item];
      }
    }
    data['options'] = options;
  }

  afterSubmit(): void {
    this.modalService.refreshTable();
    this.dialogService.confirm({
      title: helptext.idmap.clear_cache_dialog.title,
      message: helptext.idmap.clear_cache_dialog.message,
      hideCheckBox: true,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.dialogRef = this.dialog.open(EntityJobComponent, {
        data: { title: (helptext.idmap.clear_cache_dialog.job_title) }, disableClose: true,
      });
      this.dialogRef.componentInstance.setCall('idmap.clear_idmap_cache');
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        this.dialog.closeAll();
        this.dialogService.info(helptext.idmap.clear_cache_dialog.success_title,
          helptext.idmap.clear_cache_dialog.success_msg, '250px', '', true);
      });
      this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
        this.dialog.closeAll();
        new EntityUtils().handleWsError(this.entityForm, res);
      });
    });
  }
}
