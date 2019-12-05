import {ApplicationRef, Component, Injector} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';

import { EntityUtils } from '../../common/entity/utils';
import { SystemGeneralService, WebSocketService } from '../../../services/';
import {FieldConfig} from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {  DialogService } from '../../../services/';
import helptext from '../../../helptext/directoryservice/activedirectory';

@Component({
  selector : 'app-activedirectory',
  template : '<entity-form [conf]="this"></entity-form>',
})

export class ActiveDirectoryComponent {
  protected queryCall: string = 'activedirectory.config';
  protected updateCall: string = 'activedirectory.update';
  public isEntity = false;
  protected isBasicMode = true;
  protected idmapBacked: any = null;
  protected certificate: any;
  protected kerberos_realm: any;
  protected kerberos_principal: any;
  protected ssl: any;
  protected idmap_backend: any;
  protected nss_info: any;
  protected ldap_sasl_wrapping: any;
  public adStatus = false;
  entityEdit: any;

  public custActions: Array<any> = [
    {
      'id' : helptext.activedirectory_custactions_basic_id,
      'name' : helptext.activedirectory_custactions_basic_name,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : helptext.activedirectory_custactions_advanced_id,
      'name' : helptext.activedirectory_custactions_advanced_name,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : helptext.activedirectory_custactions_edit_imap_id,
      'name' : helptext.activedirectory_custactions_edit_imap_name,
      function : () => {
        this.router.navigate(new Array('').concat(['directoryservice','idmap', this.idmapBacked, 'activedirectory']));
      }
    },
    {
      'id' : helptext.activedirectory_custactions_clearcache_id,
      'name' : helptext.activedirectory_custactions_clearcache_name,
       function : async () => {
         this.systemGeneralService.refreshDirServicesCache().subscribe((cache_status)=>{
          this.dialogservice.Info(helptext.activedirectory_custactions_clearcache_dialog_title, 
            helptext.activedirectory_custactions_clearcache_dialog_message);
        })
      }
    },
    {
      'id' : 'leave_domain',
      'name' : helptext.activedirectory_custactions_leave_domain,
      function : () => { 
        const that = this;
        console.log(that)
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
                required: true
              },
              {
                type: 'input',
                name: 'password',
                placeholder: helptext.ad_leave_domain_dialog.pw,
                inputType : 'password',
                togglePw: true,
                required: true
              },
            ],
            saveButtonText: helptext.activedirectory_custactions_leave_domain,
            customSubmit: function (entityDialog) {
              const value = entityDialog.formValue;
              const self = entityDialog;
              self.loader.open();
              self.ws.call('activedirectory.leave', [{username: value.username, password: value.password}])
                .subscribe((res) => {
                  self.loader.close();
                  self.dialogRef.close(true);
                  _.find(that.fieldConfig, {'name' : 'enable'})['value'] = false;
                  that.entityEdit.formGroup.controls['enable'].setValue(false);
                  that.adStatus = false;
                  that.isCustActionVisible('leave_domain');
                  that.dialogservice.Info(helptext.ad_leave_domain_dialog.success, 
                    helptext.ad_leave_domain_dialog.success_msg, '400px', 'info', true);
                },
                err => {
                  self.loader.close();
                  new EntityUtils().handleWSError(helptext.ad_leave_domain_dialog.error, err, that.dialogservice);
                });
            }
          }
        ); 
      }
    },
  ];

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'Section 1',
      class: 'section_one',
      label:true,
      config:[
    {
      type : 'input',
      name : helptext.activedirectory_domainname_name,
      placeholder : helptext.activedirectory_domainname_placeholder,
      tooltip : helptext.activedirectory_domainname_tooltip,
      required: true,
      validation : helptext.activedirectory_domainname_validation
    },
    {
      type : 'input',
      name : helptext.activedirectory_bindname_name,
      placeholder : helptext.activedirectory_bindname_placeholder,
      tooltip : helptext.activedirectory_bindname_tooltip,
      required: true,
      validation : helptext.activedirectory_bindname_validation,
      disabled: false,
      isHidden:true
    },
    {
      type : 'input',
      inputType : 'password',
      name : helptext.activedirectory_bindpw_name,
      placeholder : helptext.activedirectory_bindpw_placeholder,
      tooltip : helptext.activedirectory_bindpw_tooltip,
      togglePw: true,
      disabled: false,
      isHidden:false
    },
    {
      type : 'checkbox',
      name : helptext.activedirectory_enable_name,
      placeholder : helptext.activedirectory_enable_placeholder,
      tooltip : helptext.activedirectory_enable_tooltip,
    },
  ]},
  {
    name: 'Section Two',
    class: 'section_two',
    label:true,
    config:[
    {
      type : 'select',
      name : helptext.activedirectory_ssl_name,
      placeholder : helptext.activedirectory_ssl_placeholder,
      tooltip : helptext.activedirectory_ssl_tooltip,
      options : []
    },
    {
      type : 'select',
      name : helptext.activedirectory_certificate_name,
      placeholder : helptext.activedirectory_certificate_placeholder,
      tooltip : helptext.activedirectory_certificate_tooltip,
      options : [
        {label : '---', value : ""},
      ]
    },
    {
      type : 'checkbox',
      name : 'validate_certificates',
      placeholder : helptext.ad_validate_certificates_placeholder,
      tooltip : helptext.ad_validate_certificates_tooltip,
    },
    {
      type : 'checkbox',
      name : helptext.activedirectory_verbose_logging_name,
      placeholder : helptext.activedirectory_verbose_logging_placeholder,
      tooltip : helptext.activedirectory_verbose_logging_tooltip,
    },
    {
      type : 'checkbox',
      name : helptext.activedirectory_trusted_doms_name,
      placeholder : helptext.activedirectory_trusted_doms_placeholder,
      tooltip : helptext.activedirectory_trusted_doms_tooltip,
    },
    {
      type : 'checkbox',
      name : helptext.activedirectory_default_dom_name,
      placeholder : helptext.activedirectory_default_dom_placeholder,
      tooltip : helptext.activedirectory_default_dom_tooltip,
    },
    {
      type : 'checkbox',
      name : helptext.activedirectory_dns_updates_name,
      placeholder : helptext.activedirectory_dns_updates_placeholder,
      tooltip : helptext.activedirectory_dns_updates_tooltip,
    },
    {
      type : 'checkbox',
      name : helptext.activedirectory_disable_fn_cache_name,
      placeholder : helptext.activedirectory_disable_fn_cache_placeholder,
      tooltip : helptext.activedirectory_disable_fn_cache_tooltip,
    }
    ]},
    {
      name:'divider',
      divider:true
    },
    {
      name: 'Section Three',
      class: 'section_three',
      label:true,
      width: '48%',
      config:[
    {
      type : 'input',
      name : helptext.activedirectory_site_name,
      placeholder : helptext.activedirectory_site_placeholder,
      tooltip : helptext.activedirectory_site_tooltip,
    },
    {
      type : 'select',
      name : helptext.activedirectory_kerberos_realm_name,
      placeholder : helptext.activedirectory_kerberos_realm_placeholder,
      tooltip : helptext.activedirectory_kerberos_realm_tooltip,
      options : [{label: '---', value: null}]
    },
    {
      type : 'select',
      name : helptext.activedirectory_kerberos_principal_name,
      placeholder : helptext.activedirectory_kerberos_principal_placeholder,
      tooltip : helptext.activedirectory_kerberos_principal_tooltip,
      options : [
        {label : '---', value : ""},
      ]
    },
    {
      type : 'input',
      name : helptext.computer_account_OU_name,
      placeholder : helptext.computer_account_OU_placeholder,
      tooltip : helptext.computer_account_OU_tooltip,
    },
    {
      type : 'input',
      name : helptext.activedirectory_timeout_name,
      placeholder : helptext.activedirectory_timeout_placeholder,
      tooltip : helptext.activedirectory_timeout_tooltip,
    },
    {
      type : 'input',
      name : helptext.activedirectory_dns_timeout_name,
      placeholder : helptext.activedirectory_dns_timeout_placeholder,
      tooltip : helptext.activedirectory_dns_timeout_tooltip,
    }
      ]},
      {
        name: 'Section 3.5',
        class: 'section_three-five',
        label:false,
        width: '4%',
        config:[]},
      {
        name: 'Section Four',
        class: 'section_four',
        label:true,
        width: '48%',
        config:[
    {
      type : 'select',
      name : helptext.activedirectory_idmap_backend_name,
      placeholder : helptext.activedirectory_idmap_backend_placeholder,
      tooltip : helptext.activedirectory_idmap_backend_tooltip,
      options : []
    },
    {
      type : 'select',
      name : helptext.activedirectory_nss_info_name,
      placeholder : helptext.activedirectory_nss_info_placeholder,
      tooltip : helptext.activedirectory_nss_info_tooltip,
      options : []
    },
    {
      type : 'select',
      name : helptext.activedirectory_sasl_wrapping_name,
      placeholder : helptext.activedirectory_sasl_wrapping_placeholder,
      tooltip : helptext.activedirectory_sasl_wrapping_tooltip,
      options : []
    },
    {
      type : 'input',
      name : helptext.activedirectory_netbiosname_a_name,
      placeholder : helptext.activedirectory_netbiosname_a_placeholder,
      tooltip : helptext.activedirectory_netbiosname_a_tooltip,
      validation : helptext.activedirectory_netbiosname_a_validation,
      required : true
    },
    {
      type : 'input',
      name : helptext.activedirectory_netbiosname_b_name,
      placeholder : helptext.activedirectory_netbiosname_b_placeholder,
      tooltip : helptext.activedirectory_netbiosname_b_tooltip,
      validation : helptext.activedirectory_netbiosname_b_validation,
      required : true,
      isHidden: true,
      disabled: true
    },
    {
      type : 'input',
      name : helptext.activedirectory_netbiosalias_name,
      placeholder : helptext.activedirectory_netbiosalias_placeholder,
      tooltip : helptext.activedirectory_netbiosalias_tooltip,
    }
      ]}
  ];

  protected advanced_field: Array<any> = helptext.activedirectory_advanced_fields;

  isCustActionVisible(actionname: string) {
    if (actionname === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionname === 'basic_mode' && this.isBasicMode === true) {
      return false;
    } else if ((actionname === 'edit_idmap' || actionname === 'leave_domain') && this.isBasicMode === true) {
      return false;
    } else if (actionname === 'leave_domain' && this.adStatus === false) {
      return false;
    }
    return true;
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService,
              protected dialogservice: DialogService) {}

  resourceTransformIncomingRestData(data) {
    if (data['kerberos_realm'] && data['kerberos_realm'] !== null) {
      data['kerberos_realm'] = data['kerberos_realm'].id;
    }
    data['netbiosalias'] = data['netbiosalias'].join(" ");
    delete data['bindpw'];
    return data;
  }

  preInit(entityForm: any) {
    if (window.localStorage.getItem('is_freenas') === 'false') {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        if (is_ha) {
          this.ws.call('smb.get_smb_ha_mode').subscribe((ha_mode) => {
            if (ha_mode === 'LEGACY') {
              entityForm.setDisabled('netbiosname_b', false, false);
            }
          })
        }
      });
    }
    this.ws.call('directoryservices.get_state').subscribe((res) => {
      res.activedirectory === 'HEALTHY' ? this.adStatus = true : this.adStatus = false;
    });
  }

  afterInit(entityEdit: any) { 
    this.entityEdit = entityEdit;
    this.ws.call('kerberos.realm.query').subscribe((res) => {
      this.kerberos_realm = _.find(this.fieldConfig, {name : 'kerberos_realm'});
      res.forEach((item) => {
        this.kerberos_realm.options.push(
            {label : item.realm, value : item.id});
      });
    });

    this.ws.call('kerberos.keytab.kerberos_principal_choices').subscribe((res) => {
      this.kerberos_principal = _.find(this.fieldConfig, {name : 'kerberos_principal'});
      res.forEach((item) => {
        this.kerberos_principal.options.push(
            {label : item, value : item});
      });
    });

    this.systemGeneralService.getCA().subscribe((res) => {
      this.certificate = _.find(this.fieldConfig, {name : 'certificate'});
      res.forEach((item) => {
        this.certificate.options.push(
            {label : item.name, value : item.id});
      });
    });

    this.ws.call('activedirectory.ssl_choices').subscribe((res) => {
      this.ssl = _.find(this.fieldConfig, {name : 'ssl'});
      res.forEach((item) => {
        this.ssl.options.push(
            {label : item, value : item});
      });
    });

    this.ws.call('activedirectory.idmap_backend_choices').subscribe((res) => {
      this.idmap_backend = _.find(this.fieldConfig, {name : 'idmap_backend'});
      res.forEach((item) => {
        this.idmap_backend.options.push(
            {label : item, value : item});
      });
    });

    this.ws.call('activedirectory.nss_info_choices').subscribe((res) => {
      this.nss_info = _.find(this.fieldConfig, {name : 'nss_info'});
      res.forEach((item) => {
        this.nss_info.options.push(
            {label : item, value : item});
      });
    });

    this.ws.call('activedirectory.sasl_wrapping_choices').subscribe((res) => {
      this.ldap_sasl_wrapping = _.find(this.fieldConfig, {name : 'ldap_sasl_wrapping'});
      res.forEach((item) => {
        this.ldap_sasl_wrapping.options.push(
            {label : item, value : item});
      });
    });

    entityEdit.formGroup.controls['idmap_backend'].valueChanges.subscribe((res)=> {
      if ((this.idmapBacked != null) && (this.idmapBacked !== res)) {
        this.dialogservice.confirm(helptext.activedirectory_idmap_change_dialog_title,
          helptext.activedirectory_idmap_change_dialog_message).subscribe(
        (confirm) => {
          if (confirm) {
            this.idmapBacked = res;
          } else {
            entityEdit.formGroup.controls['idmap_backend'].setValue(this.idmapBacked);
          }
        });
      } else {
        this.idmapBacked = res;
      }
    });

    entityEdit.formGroup.controls['enable'].valueChanges.subscribe((res)=> {
      _.find(this.fieldConfig, {'name' : 'bindpw'})['required'] = res;
    });

    entityEdit.formGroup.controls['kerberos_principal'].valueChanges.subscribe((res)=>{
      if(res){
        entityEdit.setDisabled('bindname', true);
        entityEdit.setDisabled('bindpw', true);
        _.find(this.fieldConfig, {'name' : 'bindname'})['isHidden'] = true;
        _.find(this.fieldConfig, {'name' : 'bindpw'})['isHidden'] = true;

      } else {
        entityEdit.setDisabled('bindname', false);
        entityEdit.setDisabled('bindpw', false);
        _.find(this.fieldConfig, {'name' : 'bindname'})['isHidden'] = false;
        _.find(this.fieldConfig, {'name' : 'bindpw'})['isHidden'] = false;
      }

    })

    entityEdit.submitFunction = this.submitFunction;
  }

  beforeSubmit(data){
    data.netbiosalias = data.netbiosalias.trim();
    if (data.netbiosalias.length > 0) {
      data.netbiosalias = data.netbiosalias.split(" ");
    } else {
      data.netbiosalias = [];
    }
    if(data.kerberos_principal){
      data.bindpw = ""
    }
    data['site'] = data['site'] === null ? '' : data['site'];
    for (let i in data) {
      if(data[i]===null) {
        delete data[i];
      }
    }
  }

  submitFunction(body: any) {
    return this.ws.call('activedirectory.update', [body]);
  }

  afterSubmit(value) {
    if (value.enable) {
      this.adStatus = true;
    }
  }
}
