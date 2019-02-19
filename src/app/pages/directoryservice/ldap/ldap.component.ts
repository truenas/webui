import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Subscription';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import {  DialogService } from '../../../services/';
import helptext from '../../../helptext/directoryservice/ldap';

@Component({
  selector : 'app-ldap',
  template : '<entity-form [conf]="this"></entity-form>',
})

export class LdapComponent {
  protected resource_name = 'directoryservice/ldap';
  protected isBasicMode = true;
  protected idmapBacked: any;
  protected ldap_kerberos_realm: any;
  protected ldap_kerberos_principal: any;
  protected ldap_ssl: any;
  protected ldapCertificate: any;
  protected ldap_idmap_backend: any;
  protected ldap_schema: any;
  protected ldap_hostname: any;
  protected entityForm: any;
  public custActions: Array<any> = [
    {
      id : helptext.ldap_custactions_basic_id,
      name : helptext.ldap_custactions_basic_name,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      id : helptext.ldap_custactions_advanced_id,
      name : helptext.ldap_custactions_advanced_name,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      id : helptext.ldap_custactions_edit_imap_id,
      name : helptext.ldap_custactions_edit_imap_name,
      function : () => {
        this.router.navigate(new Array('').concat(['directoryservice','idmap', this.idmapBacked, 'ldap']));
      }
    },
    {
      'id' : helptext.ldap_custactions_clearcache_id,
      'name' : helptext.ldap_custactions_clearcache_name,
       function : async () => {
         this.ws.call('notifier.ds_clearcache').subscribe((cache_status)=>{
          this.dialogservice.Info(helptext.ldap_custactions_clearcache_dialog_title,
            helptext.ldap_custactions_clearcache_dialog_message);

        })
      }
    },
  ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : helptext.ldap_hostname_name,
      placeholder : helptext.ldap_hostname_placeholder,
      tooltip: helptext.ldap_hostname_tooltip,
      required: true,
      validation: helptext.ldap_hostname_validation
    },
    {
      type : 'input',
      name : helptext.ldap_hostname_noreq_name,
      placeholder : helptext.ldap_hostname_noreq_placeholder,
      tooltip: helptext.ldap_hostname_noreq_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_basedn_name,
      placeholder : helptext.ldap_basedn_placeholder,
      tooltip: helptext.ldap_basedn_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_binddn_name,
      placeholder : helptext.ldap_binddn_placeholder,
      tooltip: helptext.ldap_binddn_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_bindpw_name,
      placeholder : helptext.ldap_bindpw_placeholder,
      tooltip: helptext.ldap_bindpw_tooltip,
      inputType : 'password',
      togglePw : true
    },
    {
      type : 'checkbox',
      name : helptext.ldap_anonbind_name,
      placeholder : helptext.ldap_anonbind_placeholder,
      tooltip: helptext.ldap_anonbind_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_usersuffix_name,
      placeholder : helptext.ldap_usersuffix_placeholder,
      tooltip: helptext.ldap_usersuffix_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_groupsuffix_name,
      placeholder : helptext.ldap_groupsuffix_placeholder,
      tooltip: helptext.ldap_groupsuffix_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_passwordsuffix_name,
      placeholder : helptext.ldap_passwordsuffix_placeholder,
      tooltip: helptext.ldap_passwordsuffix_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_machinesuffix_name,
      placeholder : helptext.ldap_machinesuffix_placeholder,
      tooltip: helptext.ldap_machinesuffix_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_sudosuffix_name,
      placeholder : helptext.ldap_sudosuffix_placeholder,
      tooltip: helptext.ldap_sudosuffix_tooltip
    },
    {
      type : 'select',
      name : helptext.ldap_kerberos_realm_name,
      placeholder : helptext.ldap_kerberos_realm_placeholder,
      tooltip: helptext.ldap_kerberos_realm_tooltip,
      options : []
    },
    {
      type : 'select',
      name : helptext.ldap_kerberos_principal_name,
      placeholder : helptext.ldap_kerberos_principal_placeholder,
      tooltip: helptext.ldap_kerberos_principal_tooltip,
      options : []
    },
    {
      type : 'select',
      name : helptext.ldap_ssl_name,
      placeholder : helptext.ldap_ssl_placeholder,
      tooltip: helptext.ldap_ssl_tooltip,
      options : []
    },
    {
      type : 'select',
      name : helptext.ldap_certificate_name,
      placeholder : helptext.ldap_certificate_placeholder,
      tooltip: helptext.ldap_certificate_tooltip,
      options : []
    },
    {
      type : 'input',
      name : helptext.ldap_timeout_name,
      placeholder : helptext.ldap_timeout_placeholder,
      tooltip: helptext.ldap_timeout_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_dns_timeout_name,
      placeholder : helptext.ldap_dns_timeout_placeholder,
      tooltip: helptext.ldap_dns_timeout_tooltip
    },
    {
      type : 'select',
      name : helptext.ldap_idmap_backend_name,
      placeholder : helptext.ldap_idmap_backend_placeholder,
      tooltip: helptext.ldap_idmap_backend_tooltip,
      options : []
    },
    {
      type : 'checkbox',
      name : helptext.ldap_has_samba_schema_name,
      placeholder : helptext.ldap_has_samba_schema_placeholder,
      tooltip: helptext.ldap_has_samba_schema_tooltip
    },
    {
      type : 'textarea',
      name : helptext.ldap_auxiliary_parameters_name,
      placeholder : helptext.ldap_auxiliary_parameters_placeholder,
      tooltip: helptext.ldap_auxiliary_parameters_tooltip
    },
    {
      type : 'select',
      name : helptext.ldap_schema_name,
      placeholder : helptext.ldap_schema_placeholder,
      tooltip: helptext.ldap_schema_tooltip,
      options : []
    },
    {
      type : 'checkbox',
      name : helptext.ldap_enable_name,
      placeholder : helptext.ldap_enable_placeholder,
      tooltip: helptext.ldap_enable_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_netbiosname_a_name,
      placeholder : helptext.ldap_netbiosname_a_placeholder,
      tooltip: helptext.ldap_netbiosname_a_tooltip
    },
    {
      type : 'input',
      name : helptext.ldap_netbiosalias_name,
      placeholder : helptext.ldap_netbiosalias_placeholder,
      tooltip: helptext.ldap_netbiosalias_tooltip
    }
  ];

  protected advanced_field: Array<any> = helptext.ldap_advanced_fields;

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    } else if (actionId === 'edit_idmap' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }




  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService,
              private dialogservice: DialogService) {}

  resourceTransformIncomingRestData(data) {
    delete data['ldap_bindpw'];
    data['ldap_hostname_noreq'] = data['ldap_hostname'];
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.rest.get("directoryservice/kerberosrealm", {}).subscribe((res) => {
      this.ldap_kerberos_realm = _.find(this.fieldConfig, {name : 'ldap_kerberos_realm'});
      res.data.forEach((item) => {
        this.ldap_kerberos_realm.options.push(
          {label : item.krb_realm, value : item.id});
      });
    });

    this.rest.get("directoryservice/kerberosprincipal", {}).subscribe((res) => {
      this.ldap_kerberos_principal = _.find(this.fieldConfig, {name : 'ldap_kerberos_principal'});
      res.data.forEach((item) => {
        this.ldap_kerberos_principal.options.push(
          {label : item.principal_name, value : item.id});
      });
    });

    this.ws.call('notifier.choices', ['LDAP_SSL_CHOICES']).subscribe((res) => {
      this.ldap_ssl = _.find(this.fieldConfig, {name : 'ldap_ssl'});
      res.forEach((item) => {
        this.ldap_ssl.options.push(
          {label : item[1], value : item[0]});
      });
    });

    this.systemGeneralService.getCA().subscribe((res) => {
      this.ldapCertificate =
          _.find(this.fieldConfig, {name : 'ldap_certificate'});
      res.forEach((item) => {
        this.ldapCertificate.options.push(
          {label : item.name, value : item.id});
      });
    });

    this.ws.call('notifier.choices', ['IDMAP_CHOICES']).subscribe((res) => {
      this.ldap_idmap_backend = _.find(this.fieldConfig, {name : 'ldap_idmap_backend'});
      res.forEach((item) => {
        this.ldap_idmap_backend.options.push(
          {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['LDAP_SCHEMA_CHOICES']).subscribe((res) => {
      this.ldap_schema = _.find(this.fieldConfig, {name: 'ldap_schema'});
      res.forEach((item => {
        this.ldap_schema.options.push(
          {label : item[1], value : item[0]});
      }));
    });

    entityEdit.formGroup.controls['ldap_idmap_backend'].valueChanges.subscribe((res)=> {
      this.idmapBacked = res;
    })
    const enabled = entityEdit.formGroup.controls['ldap_enable'].value;
    this.entityForm.setDisabled('ldap_hostname', !enabled, !enabled);
    this.entityForm.setDisabled('ldap_hostname_noreq', enabled, enabled);
    entityEdit.formGroup.controls['ldap_enable'].valueChanges.subscribe((res)=> {
      this.entityForm.setDisabled('ldap_hostname', !res, !res);
      this.entityForm.setDisabled('ldap_hostname_noreq', res, res);
      if(!res){
        this.entityForm.formGroup.controls['ldap_hostname_noreq'].setValue(this.entityForm.formGroup.controls['ldap_hostname'].value);
      }
      else{
        this.entityForm.formGroup.controls['ldap_hostname'].setValue(this.entityForm.formGroup.controls['ldap_hostname_noreq'].value);
      }
      
    })
  }
  beforeSubmit(data){
    if(data["ldap_enable"]){
      data["ldap_hostname_noreq"] = data["ldap_hostname"];
    } else {
      data["ldap_hostname"] = data["ldap_hostname_noreq"];
    }
    delete(data['ldap_hostname_noreq']);
  }
}
