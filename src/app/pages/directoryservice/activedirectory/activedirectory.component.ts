import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Subscription';
import {RestService, SystemGeneralService, WebSocketService} from '../../../services/';
import {FieldConfig} from '../../common/entity/entity-form/models/field-config.interface';
import {  DialogService } from '../../../services/';
import { Validators } from '@angular/forms';

@Component({
  selector : 'app-activedirectory',
  template : '<entity-form [conf]="this"></entity-form>',
})

export class ActiveDirectoryComponent {
  protected resource_name = 'directoryservice/activedirectory';
  protected isBasicMode = true;
  protected idmapBacked: any;
  protected ad_certificate: any;
  protected ad_kerberos_realm: any;
  protected ad_kerberos_principal: any;
  protected ad_ssl: any;
  protected ad_idmap_backend: any;
  protected ad_nss_info: any;
  protected ad_ldap_sasl_wrapping: any;

  public custActions: Array<any> = [
    {
      'id' : 'basic_mode',
      'name' : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      'name' : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'edit_idmap',
      'name' : 'Edit Idmap',
      function : () => {
        this.router.navigate(new Array('').concat(['directoryservice','idmap', this.idmapBacked, 'activedirectory']));
      }
    },
    {
      'id' : 'ds_clearcache',
      'name' : 'Rebuild Directory Service Cache',
       function : async () => {
         this.ws.call('notifier.ds_clearcache').subscribe((cache_status)=>{
          this.dialogservice.Info("Active Directory", "The cache is being rebuilt.");
          
        })
      }
    }
  ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'ad_domainname',
      placeholder : 'Domain Name',
      tooltip : 'Name of Active Directory domain (<i>example.com</i>)\
 or child domain (<i>sales.example.com</i>). This setting is mandatory\
 and the GUI refuses to save the settings if the domain controller\
 for the specified domain cannot be found.',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ad_bindname',
      placeholder : 'Domain Account Name',
      tooltip : 'Name of the Active Directory administrator account.\
 This setting is mandatory and the GUI refuses to save the settings\
 if it cannot connect to the domain controller using this account name.',
    },
    {
      type : 'input',
      name : 'ad_bindpw',
      placeholder : 'Domain Account Password',
      tooltip : 'Password for the Active Directory administrator\
 account. This setting is mandatory and the GUI refuses to save the\
 settings if it cannot connect to the domain controller using this\
 password.',
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'ad_monitor_frequency',
      placeholder : 'AD check connectivity frequency (seconds)',
      tooltip : 'How often to verify that Active Directory services are\
 active.',
    },
    {
      type : 'input',
      name : 'ad_recover_retry',
      placeholder : 'How many recovery attempts',
      tooltip : 'Number of times to attempt reconnecting to the Active\
 directory server. Tries forever when set to <i>0</i>.',
    },
    {
      type : 'checkbox',
      name : 'ad_enable_monitor',
      placeholder : 'Enable AD Monitoring',
      tooltip : 'Restart Active Directory automatically if the service\
 is disconnected.',
    },
    {
      type : 'select',
      name : 'ad_ssl',
      placeholder : 'Encryption Mode',
      tooltip : 'Choices are <i>Off, SSL</i> or <i>TLS</i>.',
      options : []
    },
    {
      type : 'select',
      name : 'ad_certificate',
      placeholder : 'Certificate',
      tooltip : 'Select the certificate of the Active Directory server\
 if SSL connections are used. If a certificate does not exist yet,\
 create a <a href="http://doc.freenas.org/11/system.html#cas"\
 target="_blank">CA</a>, then create a certificate on the Active\
 Directory server and import it to the FreeNAS system with\
 <a href="http://doc.freenas.org/11/system.html#certificates"\
 target="_blank">Certificates</a>.',
      options : []
    },
    {
      type : 'checkbox',
      name : 'ad_verbose_logging',
      placeholder : 'Verbose logging',
      tooltip : 'When checked, logs attempts to join the domain to\
 <b>/var/log/messages</b>.',
    },
    {
      type : 'checkbox',
      name : 'ad_unix_extensions',
      placeholder : 'UNIX extensions',
      tooltip : '<b>Only</b> check this box if the AD server has been\
 explicitly configured to map permissions for UNIX users. Checking this\
 box provides persistent UIDs and GUIDs, otherwise, users and groups\
 are mapped to the UID or GUID range configured in Samba.',
    },
    {
      type : 'checkbox',
      name : 'ad_allow_trusted_doms',
      placeholder : 'Allow Trusted Domains',
      tooltip : 'Should only be enabled if network has active <a\
 href="https://technet.microsoft.com/en-us/library/cc757352(WS.10).aspx"\
 target="_blank">domain/forest trusts</a> and you need to manage files\
 on multiple domains. use with caution as it will generate more\
 winbind traffic, slowing down the ability to filter through\
 user/group info.',
    },
    {
      type : 'checkbox',
      name : 'ad_use_default_domain',
      placeholder : 'Use Default Domain',
      tooltip : 'When unchecked, the domain name is prepended to the\
 username. If <b>Allow Trusted Domains</b> is checked and multiple\
 domains use the same usernames, uncheck this box to prevent name\
 collisions.',
    },
    {
      type : 'checkbox',
      name : 'ad_allow_dns_updates',
      placeholder : 'Allow DNS updates',
      tooltip : 'When unchecked, disables Samba from doing DNS updates\
 when joining a domain.',
    },
    {
      type : 'checkbox',
      name : 'ad_disable_freenas_cache',
      placeholder : 'Disable FreeNAS Cache',
      tooltip : 'When checked, disables caching AD users and gorups.\
 Useful if you cannot bind to a domain with a large number of users or\
 groups.',
    },
    {
      type : 'input',
      name : 'ad_userdn',
      placeholder : 'User Base',
      tooltip : 'Distinguished name (DN) of the user container in\
 Active Directory.',
    },
    {
      type : 'input',
      name : 'ad_groupdn',
      placeholder : 'Group Base',
      tooltip : 'Distinguished name (DN) of the gorup container in\
 Active Directory.',
    },
    {
      type : 'input',
      name : 'ad_site',
      placeholder : 'Site Name',
      tooltip : 'The relative distinguished name of the site object in\
 Active Directory.',
    },
    {
      type : 'input',
      name : 'ad_dcname',
      placeholder : 'Domain Controller',
      tooltip : 'Will automatically be added to the SRV record for the\
 domain and, when multiple controllers are specified, FreeNAS selects\
 the closest DC which responds. Use a short form of the FQDN like\
 <b>exampleserver</b>.',
    },
    {
      type : 'input',
      name : 'ad_gcname',
      placeholder : 'Global Catalog Server',
      tooltip : 'If the hostname of the global catalog server to use is\
 specified, make sure it is resolvable.',
    },
    {
      type : 'select',
      name : 'ad_kerberos_realm',
      placeholder : 'Kerberos Realm',
      tooltip : 'Select the realm created using the instructions in <a\
 href="http://doc.freenas.org/11/directoryservice.html#kerberos-realms"\
 target="_blank">Kerberos Realms</a>.',
      options : []
    },
    {
      type : 'select',
      name : 'ad_kerberos_principal',
      placeholder : 'Kerberos Principal',
      tooltip : 'Browse to the location of the keytab created using the\
 instructions in <a\
 href="http://doc.freenas.org/11/directoryservice.html#kerberos-keytabs"\
 target="_blank">Kerberos Keytabs</a>.',
      options : []
    },
    {
      type : 'input',
      name : 'ad_timeout',
      placeholder : 'AD Timeout',
      tooltip : 'In seconds, increase if the AD service does not start\
 after connecting to the domain.',
    },
    {
      type : 'input',
      name : 'ad_dns_timeout',
      placeholder : 'DNS Timeout',
      tooltip : 'In seconds, increase if AD DNS queries timeout.',
    },
    {
      type : 'select',
      name : 'ad_idmap_backend',
      placeholder : 'Idmap backend',
      tooltip : 'Select the backend to use to map Windows security\
 identifiers (SIDs) to UNIX UIDs and GIDs. Click the <b>Edit</b> link\
 to configure the editable options of that backend.',
      options : []
    },
    {
      type : 'select',
      name : 'ad_nss_info',
      placeholder : 'Winbind NSS Info',
      tooltip : 'Defines the schema to use when querying AD for\
 user/group info. <i>rfc2307</i> uses the RFC2307 schema support\
 included in Windows 2003 R2, <i>sfu20</i> is for Services For Unix 3.0\
 or 3.5, and <i>sfu</i> is for Services For Unix 2.0.',
      options : []
    },
    {
      type : 'select',
      name : 'ad_ldap_sasl_wrapping',
      placeholder : 'SASL wrapping',
      tooltip : 'Defines how LDAP traffic is transmitted. Choices are\
 <i>plain</i> (plain text), <i>sign</i> (signed only), or <i>seal</i>\
 (signed and encrypted). Windows 2000 SP3 and higher can be configured\
 to enforce signed LDAP connections.',
      options : []
    },
    {
      type : 'checkbox',
      name : 'ad_enable',
      placeholder : 'Enable',
      tooltip : 'Enable the Active Directory service.',
    },
    {
      type : 'input',
      name : 'ad_netbiosname_a',
      placeholder : 'Netbios Name',
      tooltip : 'Limited to 15 characters. Automatically populated with\
 the original host name of the system. It <b>must</b> be different from\
 the <i>Workgroup</i> name.',
    },
    {
      type : 'input',
      name : 'ad_netbiosalias',
      placeholder : 'NetBIOS alias',
      tooltip : 'Limited to 15 characters.',
    }
  ];

  protected advanced_field: Array<any> = [
    'ad_ssl',
    'ad_certificate',
    'ad_verbose_logging',
    'ad_unix_extensions',
    'ad_allow_trusted_doms',
    'ad_use_default_domain',
    'ad_allow_dns_updates',
    'ad_disable_freenas_cache',
    'ad_userdn',
    'ad_groupdn',
    'ad_site',
    'ad_dcname',
    'ad_gcname',
    'ad_kerberos_realm',
    'ad_kerberos_principal',
    'ad_timeout',
    'ad_dns_timeout',
    'ad_idmap_backend',
    'ad_nss_info',
    'ad_ldap_sasl_wrapping',
    'ad_netbiosname_a',
    'ad_netbiosalias',
  ];

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

    entityEdit.formGroup.controls['ad_idmap_backend'].valueChanges.subscribe((res)=> {
      this.idmapBacked = res;
    })
  }
}
