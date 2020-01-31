import { Component } from '@angular/core';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ValidationService, IdmapService } from '../../../services/';
import { T } from '../../../translate-marker';
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
  public rangeLowValidation = [
    ...helptext.idmap_range_validator, 
    this.validationService.rangeValidator(1000, 2147483647)
  ];
  public rangeHighValidation = [
    ...helptext.idmap_range_validator, 
    this.validationService.rangeValidator(1000, 2147483647), 
    this.validationService.greaterThan('range_low', [helptext.idmap_range_low_placeholder])
  ];
  private entityForm: any;
  protected backendChoices: any;
  protected fieldConfig: FieldConfig[] = [];

  public fieldSetDisplay  = 'default';
  protected fieldSets: FieldSet[] = [
    {
      name: "Idmap stuff",
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
        },
        {
          type:  'input' ,
          name: 'range_low',
          inputType: 'number',
          placeholder: helptext.idmap.range_low.placeholder,
          tooltip: helptext.idmap.range_low.tooltip,
          validation: this.rangeLowValidation,
          required: true
        },
        {
          type:  'input' ,
          name: 'range_high',
          inputType: 'number',
          placeholder: helptext.idmap.range_high.placeholder,
          tooltip: helptext.idmap.range_high.tooltip,
          validation: this.rangeHighValidation,
          required: true
        },
        {
          type:  'select' ,
          name: 'certificate_id',
          placeholder: helptext.idmap.certificate_id.placeholder,
          tooltip: helptext.idmap.certificate_id.tooltip,
          options: []
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
      name: "Idmap Options",
      class: 'idmap-configuration-form',
      label:true,
      width: '48%',
      config: [
        {
          type: 'input',
          name: 'schema_mode',
          placeholder: 'Schema Mode',
          tooltip: T(''),
        },
        {
          type:  'checkbox' ,
          name: 'unix_primary_group',
          placeholder: 'Unix Primary Group',
          tooltip: helptext.idmap.dns_domain_name.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'unix_nss_info',
          placeholder: 'Unix NSS Info',
          tooltip: helptext.idmap.dns_domain_name.tooltip,
        },
        {
          type:  'input' ,
          name: 'rangesize',
          inputType: 'number',
          placeholder: 'Range Size',
          tooltip: helptext.idmap.range_low.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'readonly',
          placeholder: 'Read Only',
          tooltip: helptext.idmap.dns_domain_name.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'ignore_builtin',
          placeholder: 'Ignore Built-In',
          tooltip: helptext.idmap.dns_domain_name.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_base_dn',
          placeholder: 'LDAP Base DN',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_user_dn',
          placeholder: 'LDAP User DN',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_user_dn_password',
          inputType: 'password',
          hideButton: false,
          placeholder: 'LDAP User DN Password',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_url',
          placeholder: 'LDAP Url',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type: 'select',
          name: 'ssl',
          placeholder: 'SSL',
          tooltip: helptext.idmap.idmap_backend.tooltip,
          options: [
            {label: 'OFF', value: 'OFF'},
            {label: 'ON', value: 'ON'},
            {label: 'START_TLS', value: 'START_TLS'}
          ]
        },
        {
          type: 'select',
          name: 'linked_service',
          placeholder: 'Linked Service',
          tooltip: helptext.idmap.idmap_backend.tooltip,
          options: [
            {label: 'LOCAL_ACCOUNT', value: 'LOCAL_ACCOUNT'},
            {label: 'LDAP', value: 'LDAP'},
            {label: 'NIS', value: 'NIS'}
          ]
        },
        {
          type:  'input' ,
          name: 'ldap_server',
          placeholder: 'LDAP Server',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'bind_path_user',
          placeholder: 'Bind Path User',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'bind_path_group',
          placeholder: 'Bind Path Group',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'user_cn',
          placeholder: 'User CN',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'cn_realm',
          placeholder: 'CN Realm',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'input' ,
          name: 'ldap_domain',
          placeholder: 'LDAP Domain',
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type:  'checkbox' ,
          name: 'sssd_compat',
          placeholder: 'SSSD Compat',
          tooltip: helptext.idmap.dns_domain_name.tooltip,
        },

      ]
    },

  ];

  private optionsFields: Array<any> = [
    'certificate_id',
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
    'bind_path_user',
    'bind_path_group',
    'user_cn',
    'cn_realm',
    'ldap_domain',
    'sssd_compat',
  ]

  constructor(protected idmapService: IdmapService, protected validationService: ValidationService) { }

  resourceTransformIncomingRestData(data) {
    console.log(data);
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.optionsFields.forEach((option) => {
      this.hideField(option, true, entityEdit);
    })

    this.idmapService.getCerts().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'certificate_id');
      res.forEach((item) => {
        config.options.push({label: item.name, value: item.id})
      })
    });

    entityEdit.formGroup.controls['idmap_backend'].valueChanges.subscribe((value) => {
      const descrip = this.backendChoices[value].description;
      const be = _.find(this.fieldConfig, { name: 'idmap_backend' });
      be.tooltip = '';
      be.tooltip += descrip;
      this.optionsFields.forEach((option) => {
        this.hideField(option, true, entityEdit);
      })
      for(let i in this.backendChoices[value].parameters) {
        this.optionsFields.forEach((option) => {
          if (option === i) {
            const params = this.backendChoices[value].parameters[option];
            this.hideField(option, false, entityEdit);
            _.find(this.fieldConfig, { name: option }).required = params.required;
            entityEdit.formGroup.controls[option].setValue(params.default);
            if (value === 'LDAP' || value === 'RFC2307') {
              this.hideField('certificate_id', false, entityEdit);
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
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

}
