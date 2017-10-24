import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'activedirectory',
  template : ` <entity-form [conf]="this"></entity-form>`,
})

export class ActiveDirectoryComponent {
  protected resource_name: string = 'directoryservice/activedirectory';
  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input', 
      name : 'ad_domainname', 
      placeholder : 'Domain Name'
    },
    {
      type : 'input', 
      name : 'ad_bindname', 
      placeholder : 'Domain Account Name'
    },
    {
      type : 'input',
      name : 'ad_bindpw',
      placeholder : 'Domain Account Password',
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'ad_monitor_frequency',
      placeholder : 'AD check connectivity frequency (seconds)'
    },
    {
      type : 'input',
      name : 'ad_recover_retry',
      placeholder : 'How many recovery attempts',
    },
    {
      type : 'input',
      name : 'ad_dcname',
      placeholder : 'Domain Controller',
    },
    {
      type : 'input', 
      name : 'ad_gcname', 
      placeholder : 'Global Catalog Server'
    },
    {
      type : 'input', 
      name : 'ad_site', 
      placeholder : 'Site Name'
    },
    {
      type : 'input', 
      name : 'ad_timeout', 
      placeholder : 'AD Timeout'
    },
    {
      type : 'input', 
      name : 'ad_dns_timeout', 
      placeholder : 'DNS Timeout'
    },
    {
      type : 'select',
      name : 'ad_ssl',
      placeholder : 'Encryption Mode',
      options : []
    },
    {
      type : 'select',
      name : 'ad_certificate',
      placeholder : 'Certificate',
      options : []
    },
    {
      type : 'input',
      name : 'ad_userdn',
      placeholder : 'User Base',
    },
    {
      type : 'input',
      name : 'ad_groupdn',
      placeholder : 'Group Base',
    },
    {
      type : 'select',
      name : 'ad_kerberos_realm',
      placeholder : 'Kerberos Realm',
      options : []
    },
    {
      type : 'select',
      name : 'ad_kerberos_principal',
      placeholder : 'Kerberos Principal',
      options : []
    },
    {
      type : 'select',
      name : 'ad_idmap_backend',
      placeholder : 'Idmap backend',
      options : []
    },
    {
      type : 'select',
      name : 'ad_nss_info',
      placeholder : 'Winbind NSS Info',
      options : []
    },
    {
      type : 'select',
      name : 'ad_ldap_sasl_wrapping',
      placeholder : 'SASL wrapping',
      options : []
    },
    {
      type : 'input',
      name : 'ad_netbiosname_a',
      placeholder : 'Netbios Name',
    },
    {
      type : 'input',
      name : 'ad_netbiosalias',
      placeholder : 'NetBIOS alias',
    },
    {
      type : 'checkbox',
      name : 'ad_verbose_logging',
      placeholder : 'Verbose logging',
    },
    {
      type : 'checkbox',
      name : 'ad_unix_extensions',
      placeholder : 'UNIX extensions',
    },
    {
      type : 'checkbox',
      name : 'ad_allow_trusted_doms',
      placeholder : 'Allow Trusted Domains',
    },
    {
      type : 'checkbox',
      name : 'ad_use_default_domain',
      placeholder : 'Use Default Domain',
    },
    {
      type : 'checkbox',
      name : 'ad_allow_dns_updates',
      placeholder : 'Allow DNS updates',
    },
    {
      type : 'checkbox',
      name : 'ad_disable_freenas_cache',
      placeholder : 'Disable FreeNAS Cache',
    },
    {
      type : 'checkbox',
      name : 'ad_enable_monitor',
      placeholder : 'Enable AD Monitoring'
    },
    {
      type : 'checkbox',
      name : 'ad_enable',
      placeholder : 'Enable',
    },
  ];

  protected advanced_field: Array<any> = [
    'ad_gcname',
    'ad_dcname',
    'ad_site',
    'ad_timeout',
    'ad_dns_timeout',
    'ad_ssl',
    'ad_certificate',
    'ad_userdn',
    'ad_groupdn',
    'ad_kerberos_realm',
    'ad_kerberos_principal',
    'ad_idmap_backend',
    'ad_nss_info',
    'ad_ldap_sasl_wrapping',
    'ad_netbiosname_a',
    'ad_netbiosalias',
    'ad_verbose_logging',
    'ad_unix_extensions',
    'ad_allow_trusted_doms',
    'ad_use_default_domain',
    'ad_allow_dns_updates',
    'ad_disable_freenas_cache',
  ];

  isCustActionVisible(actionname: string) {
    if (actionname === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionname === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  protected ad_certificate: any;
  protected ad_ssl: any;
  protected ad_idmap_backend: any;
  protected ad_nss_info: any;  
  protected ad_ldap_sasl_wrapping: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService) {}

  afterInit(entityEdit: any) {
    this.systemGeneralService.getCA().subscribe((res) => {
      this.ad_certificate = _.find(this.fieldConfig, {name : 'ad_certificate'});
      res.forEach((item) => {
        this.ad_certificate.options.push(
            {label : item.cert_name, value : item.id});
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

  }
}
