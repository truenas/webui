import {ApplicationRef, Component, Injector} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';

import {RestService, SystemGeneralService, WebSocketService} from '../../../services/';
import {FieldConfig} from '../../common/entity/entity-form/models/field-config.interface';
import {  DialogService } from '../../../services/';
import helptext from '../../../helptext/directoryservice/activedirectory';

@Component({
  selector : 'app-activedirectory',
  template : '<entity-form [conf]="this"></entity-form>',
})

export class ActiveDirectoryComponent {
  protected resource_name = 'directoryservice/activedirectory';
  protected isBasicMode = true;
  protected idmapBacked: any = null;
  protected ad_certificate: any;
  protected ad_kerberos_realm: any;
  protected ad_kerberos_principal: any;
  protected ad_ssl: any;
  protected ad_idmap_backend: any;
  protected ad_nss_info: any;
  protected ad_ldap_sasl_wrapping: any;

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
         this.ws.call('notifier.ds_clearcache').subscribe((cache_status)=>{
          this.dialogservice.Info(helptext.activedirectory_custactions_clearcache_dialog_title, 
            helptext.activedirectory_custactions_clearcache_dialog_message);
        })
      }
    }
  ];

  public fieldConfig: FieldConfig[] = [
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
      name : helptext.activedirectory_bindpw_name,
      placeholder : helptext.activedirectory_bindpw_placeholder,
      tooltip : helptext.activedirectory_bindpw_tooltip,
      inputType : 'password',
      togglePw: true,
      disabled: false,
      isHidden:false
    },
    {
      type : 'input',
      name : helptext.activedirectory_monitor_frequency_name,
      placeholder : helptext.activedirectory_monitor_frequency_placeholder,
      tooltip : helptext.activedirectory_monitor_frequency_tooltip,
    },
    {
      type : 'input',
      name : helptext.activedirectory_recover_retry_name,
      placeholder : helptext.activedirectory_recover_retry_placeholder,
      tooltip : helptext.activedirectory_recover_retry_tooltip,
    },
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
    },
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
      options : []
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
      name : helptext.activedirectory_timeout_name,
      placeholder : helptext.activedirectory_timeout_placeholder,
      tooltip : helptext.activedirectory_timeout_tooltip,
    },
    {
      type : 'input',
      name : helptext.activedirectory_dns_timeout_name,
      placeholder : helptext.activedirectory_dns_timeout_placeholder,
      tooltip : helptext.activedirectory_dns_timeout_tooltip,
    },
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
      type : 'checkbox',
      name : helptext.activedirectory_enable_name,
      placeholder : helptext.activedirectory_enable_placeholder,
      tooltip : helptext.activedirectory_enable_tooltip,
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
      name : helptext.activedirectory_netbiosalias_name,
      placeholder : helptext.activedirectory_netbiosalias_placeholder,
      tooltip : helptext.activedirectory_netbiosalias_tooltip,
    }
  ];

  protected advanced_field: Array<any> = helptext.activedirectory_advanced_fields;

  isCustActionVisible(actionname: string) {
    if (actionname === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionname === 'basic_mode' && this.isBasicMode === true) {
      return false;
    } else if (actionname === 'edit_idmap' && this.isBasicMode === true) {
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
    delete data['ad_bindpw'];
    return data;
  }

  afterInit(entityEdit: any) {
    this.rest.get("directoryservice/kerberosrealm", {}).subscribe((res) => {
      this.ad_kerberos_realm = _.find(this.fieldConfig, {name : 'ad_kerberos_realm'});
      res.data.forEach((item) => {
        this.ad_kerberos_realm.options.push(
            {label : item.krb_realm, value : item.id});
      });
    });

    this.rest.get("directoryservice/kerberosprincipal", {}).subscribe((res) => {
      this.ad_kerberos_principal = _.find(this.fieldConfig, {name : 'ad_kerberos_principal'});
      res.data.forEach((item) => {
        this.ad_kerberos_principal.options.push(
            {label : item.principal_name, value : item.id});
      });
    });

    this.systemGeneralService.getCA().subscribe((res) => {
      this.ad_certificate = _.find(this.fieldConfig, {name : 'ad_certificate'});
      res.forEach((item) => {
        this.ad_certificate.options.push(
            {label : item.name, value : item.id});
      });
    });

    this.ws.call('notifier.choices', ['LDAP_SSL_CHOICES']).subscribe((res) => {
      this.ad_ssl = _.find(this.fieldConfig, {name : 'ad_ssl'});
      res.forEach((item) => {
        this.ad_ssl.options.push(
            {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['IDMAP_CHOICES']).subscribe((res) => {
      this.ad_idmap_backend = _.find(this.fieldConfig, {name : 'ad_idmap_backend'});
      res.forEach((item) => {
        this.ad_idmap_backend.options.push(
            {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['NSS_INFO_CHOICES']).subscribe((res) => {
      this.ad_nss_info = _.find(this.fieldConfig, {name : 'ad_nss_info'});
      res.forEach((item) => {
        this.ad_nss_info.options.push(
            {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['LDAP_SASL_WRAPPING_CHOICES']).subscribe((res) => {
      this.ad_ldap_sasl_wrapping = _.find(this.fieldConfig, {name : 'ad_ldap_sasl_wrapping'});
      res.forEach((item) => {
        this.ad_ldap_sasl_wrapping.options.push(
            {label : item[1], value : item[0]});
      });
    });

    entityEdit.formGroup.controls['ad_idmap_backend'].valueChanges.subscribe((res)=> {
      if ((this.idmapBacked != null) && (this.idmapBacked !== res)) {
        this.dialogservice.confirm(helptext.activedirectory_idmap_change_dialog_title,
          helptext.activedirectory_idmap_change_dialog_message).subscribe(
        (confirm) => {
          if (confirm) {
            this.idmapBacked = res;
          } else {
            entityEdit.formGroup.controls['ad_idmap_backend'].setValue(this.idmapBacked);
          }
        });
      } else {
        this.idmapBacked = res;
      }
    });

    entityEdit.formGroup.controls['ad_kerberos_principal'].valueChanges.subscribe((res)=>{
      if(res){
        entityEdit.setDisabled('ad_bindname', true);
        entityEdit.setDisabled('ad_bindpw', true);
        _.find(this.fieldConfig, {'name' : 'ad_bindname'})['isHidden'] = true;
        _.find(this.fieldConfig, {'name' : 'ad_bindpw'})['isHidden'] = true;

      } else {
        entityEdit.setDisabled('ad_bindname', false);
        entityEdit.setDisabled('ad_bindpw', false);
        _.find(this.fieldConfig, {'name' : 'ad_bindname'})['isHidden'] = false;
        _.find(this.fieldConfig, {'name' : 'ad_bindpw'})['isHidden'] = false;
      }

    })
  }

  beforeSubmit(data){
    if(data.ad_kerberos_principal){
      data.ad_bindname = ""
      data.ad_bindpw = ""
    }
  }
}
