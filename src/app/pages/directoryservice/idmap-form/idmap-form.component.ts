import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ValidationService, IdmapService, DialogService } from '../../../services/';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../../pages/common/entity/utils';
import helptext from '../../../helptext/directoryservice/idmap';

@Component({
  selector: 'app-idmap-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class IdmapFormComponent {

  protected route_success: string[] = ['directoryservice', 'idmap'];
  protected isEntity: boolean = true;
  protected namesInUse = [];
  protected queryCall = 'idmap.query';
  protected addCall = 'idmap.create';
  protected editCall = 'idmap.update';
  protected queryCallOption: Array<any> = [["id", "="]];
  public rangeLowValidation = [
    ...helptext.idmap.required_validator, 
    this.validationService.rangeValidator(1000, 2147483647)
  ];
  public rangeHighValidation = [
    ...helptext.idmap.required_validator, 
    this.validationService.rangeValidator(1000, 2147483647), 
    this.validationService.greaterThan('range_low', [helptext.idmap.range_low.placeholder])
  ];
  private entityForm: any;
  protected backendChoices: any;
  protected dialogRef: any;
  protected requiredDomains = [
    'DS_TYPE_ACTIVEDIRECTORY',
    'DS_TYPE_DEFAULT_DOMAIN',
    'DS_TYPE_LDAP'
  ];
  protected readOnly = false;
  protected fieldConfig: FieldConfig[] = [];

  public fieldSetDisplay  = 'default';
  protected fieldSets: FieldSet[] = [
    {
      name: helptext.idmap.settings_label,
      class: 'idmap-configuration-form',
      label:true,
      width: '48%',
      config: [
        {
          type: 'select',
          name: 'idmap_backend',
          placeholder: helptext.idmap.idmap_backend.placeholder,
          tooltip: helptext.idmap.idmap_backend.tooltip,
          options: []
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.idmap.name.placeholder,
          tooltip: helptext.idmap.name.tooltip,
          required: true,
        },
        {
          type:  'input' ,
          name: 'dns_domain_name',
          placeholder: helptext.idmap.dns_domain_name.placeholder,
          tooltip: helptext.idmap.dns_domain_name.tooltip,
          required: true
        },
        {
          type:  'input' ,
          name: 'range_low',
          inputType: 'number',
          placeholder: helptext.idmap.range_low.placeholder,
          tooltip: helptext.idmap.range_tooltip,
          validation: this.rangeLowValidation,
          required: true
        },
        {
          type:  'input' ,
          name: 'range_high',
          inputType: 'number',
          placeholder: helptext.idmap.range_high.placeholder,
          tooltip: helptext.idmap.range_tooltip,
          validation: this.rangeHighValidation,
          required: true
        },
        {
          type:  'select' ,
          name: 'certificate',
          placeholder: helptext.idmap.certificate_id.placeholder,
          tooltip: helptext.idmap.certificate_id.tooltip,
          options: [],
          isHidden: true
        },

      ]
    },
    {      
      name: 'vert-spacer',
      class: 'vert-spacer',
      label:false,
      width: '4%',
      config:[]},
    {
      name: helptext.idmap.options_label,
      class: 'idmap-configuration-form',
      label:true,
      width: '48%',
      config: [
        {
          type: 'select',
          name: 'schema_mode',
          placeholder: helptext.idmap.schema_mode.placeholder,
          tooltip: helptext.idmap.schema_mode.tooltip,
          options: helptext.idmap.schema_mode.options
        },
        {
          type:  'checkbox' ,
          name: 'unix_primary_group',
          placeholder: helptext.idmap.unix_primary_group.placeholder,
          tooltip: helptext.idmap.unix_primary_group.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'unix_nss_info',
          placeholder: helptext.idmap.unix_nss.placeholder,
          tooltip: helptext.idmap.unix_nss.tooltip,
        },
        {
          type:  'input' ,
          name: 'rangesize',
          inputType: 'number',
          placeholder: helptext.idmap.rangesize.placeholder,
          tooltip: helptext.idmap.rangesize.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'readonly',
          placeholder: helptext.idmap.readonly.placeholder,
          tooltip: helptext.idmap.readonly.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'ignore_builtin',
          placeholder: helptext.idmap.ignore_builtin.placeholder,
          tooltip: helptext.idmap.ignore_builtin.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_base_dn',
          placeholder: helptext.idmap.ldap_basedn.placeholder,
          tooltip: helptext.idmap.ldap_basedn.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_user_dn',
          placeholder: helptext.idmap.ldap_userdn.placeholder,
          tooltip: helptext.idmap.ldap_userdn.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_user_dn_password',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext.idmap.ldap_user_dn_password.placeholder,
          tooltip: helptext.idmap.ldap_user_dn_password.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_url',
          placeholder: helptext.idmap.ldap_url.placeholder,
          tooltip: helptext.idmap.ldap_url.tooltip,
        },
        {
          type: 'select',
          name: 'ssl',
          placeholder: helptext.idmap.ssl.placeholder,
          tooltip: helptext.idmap.ssl.tooltip,
          options: helptext.idmap.ssl.options
        },
        {
          type: 'select',
          name: 'linked_service',
          placeholder: helptext.idmap.linked_service.placeholder,
          tooltip: helptext.idmap.linked_service.tooltip,
          options: helptext.idmap.linked_service.options
        },
        {
          type:  'input' ,
          name: 'ldap_server',
          placeholder: helptext.idmap.ldap_server.placeholder,
          tooltip: helptext.idmap.ldap_server.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_realm',
          placeholder: helptext.idmap.ldap_realm.placeholder,
          tooltip: helptext.idmap.ldap_realm.tooltip,
        },
        {
          type:  'input' ,
          name: 'bind_path_user',
          placeholder: helptext.idmap.bind_path_user.placeholder,
          tooltip: helptext.idmap.bind_path_user.tooltip,
        },
        {
          type:  'input' ,
          name: 'bind_path_group',
          placeholder: helptext.idmap.bind_path_group.placeholder,
          tooltip: helptext.idmap.bind_path_group.tooltip,
        },
        {
          type:  'input' ,
          name: 'user_cn',
          placeholder: helptext.idmap.user_cn.placeholder,
          tooltip: helptext.idmap.user_cn.tooltip,
        },
        {
          type:  'input' ,
          name: 'cn_realm',
          placeholder: helptext.idmap.cn_realm.placeholder,
          tooltip: helptext.idmap.cn_realm.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_domain',
          placeholder: helptext.idmap.ldap_domain.placeholder,
          tooltip: helptext.idmap.ldap_server.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'sssd_compat',
          placeholder: helptext.idmap.sssd_compat.placeholder,
          tooltip: helptext.idmap.sssd_compat.tooltip,
        }
      ]
    }
  ];

  private optionsFields: Array<any> = [
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
  ]

  constructor(protected idmapService: IdmapService, protected validationService: ValidationService,
    protected route: ActivatedRoute, protected dialogService: DialogService, protected dialog: MatDialog) { }

  resourceTransformIncomingRestData(data) {
    for (let item in data.options) {
      data[item] = data.options[item]
    }
    if (data.certificate) {
      data.certificate = data.certificate.id;
    }
    this.requiredDomains.includes(data.name) ? this.readOnly = true : this.readOnly = false;
    return data;
  }

  preInit() {
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.optionsFields.forEach((option) => {
      this.hideField(option, true, entityEdit);
    })

    this.idmapService.getCerts().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'certificate');
      config.options.push({label: '---', value: null})
      res.forEach((item) => {
        config.options.push({label: item.name, value: item.id})
      })
    });

    entityEdit.formGroup.controls['idmap_backend'].valueChanges.subscribe((value) => {
      this.optionsFields.forEach((option) => {
        this.hideField(option, true, entityEdit);
      })
      for(let i in this.backendChoices[value].parameters) {
        this.optionsFields.forEach((option) => {
          if (option === i) {
            const params = this.backendChoices[value].parameters[option];
            this.hideField(option, false, entityEdit);
           let field =  _.find(this.fieldConfig, { name: option });
           field['required'] = params.required;
            entityEdit.formGroup.controls[option].setValue(params.default);
            if (value === 'LDAP' || value === 'RFC2307') {
              this.hideField('certificate', false, entityEdit);
            } else {
              this.hideField('certificate', true, entityEdit);
            }
          }
        })
      }
    });

    this.idmapService.getBackendChoices().subscribe((res) => {
      this.backendChoices = res;
      const config = this.fieldConfig.find(c => c.name === 'idmap_backend');
      for (let item in res) {
        config.options.push({label: item, value: item})
      }
      entityEdit.formGroup.controls['idmap_backend'].setValue('AD');
    });

    setTimeout(() => {
      if (this.readOnly) {
        entityEdit.setDisabled('name', true, false)
      }
    }, 500);
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

  beforeSubmit(data) {
    let options = {}
    for (let item in data) {
      if (this.optionsFields.includes(item)) {
        if(data[item]) {
          options[item] = data[item];
        }
        delete data[item]
      }
    }
    data['options'] = options;
  }

  afterSubmit(value) {
    this.dialogService.confirm(helptext.idmap.clear_cache_dialog.title, helptext.idmap.clear_cache_dialog.message,
      true)
      .subscribe((res) => {
        if (res) {
          this.dialogRef = this.dialog.open(EntityJobComponent, { 
            data: { "title": (helptext.idmap.clear_cache_dialog.job_title) }, disableClose: true});
          this.dialogRef.componentInstance.setCall('idmap.clear_idmap_cache');
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe((res) => {
            this.dialog.closeAll();
            this.dialogService.Info(helptext.idmap.clear_cache_dialog.success_title,
              helptext.idmap.clear_cache_dialog.success_msg, '250px', '', true)
          });
          this.dialogRef.componentInstance.failure.subscribe((res) => {
            this.dialog.closeAll()
            new EntityUtils().handleWSError(this.entityForm, res);
          });
        }
      })
    }
}
