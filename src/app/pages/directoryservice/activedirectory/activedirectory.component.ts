import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Subscription';
import {RestService, SystemGeneralService, WebSocketService} from '../../../services/';
import {FieldConfig} from '../../common/entity/entity-form/models/field-config.interface';
import {  DialogService } from '../../../services/';
import { Validators } from '@angular/forms';
import { T } from '../../../translate-marker';

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
      'name' : T('Edit Idmap'),
      function : () => {
        this.router.navigate(new Array('').concat(['directoryservice','idmap', this.idmapBacked, 'activedirectory']));
      }
    },
    {
      'id' : 'ds_clearcache',
      'name' : T('Rebuild Directory Service Cache'),
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
      placeholder : T('Domain Name'),
      tooltip : T('Enter the Active Directory domain (<i>example.com</i>)\
                 or child domain (<i>sales.example.com</i>).'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ad_bindname',
      placeholder : T('Domain Account Name'),
      tooltip : T('Enter Active Directory administrator account name.'),
    },
    {
      type : 'input',
      name : 'ad_bindpw',
      placeholder : T('Domain Account Password'),
      tooltip : T('Enter the administrator account password.'),
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'ad_monitor_frequency',
      placeholder : T('Connectivity Check'),
      tooltip : T('Enter how often in seconds for the system to verify\
                 Active Directory services are functioning.'),
    },
    {
      type : 'input',
      name : 'ad_recover_retry',
      placeholder : T('Recovery Attempts'),
      tooltip : T('Enter a number of times to attempt reconnecting to the\
                 Active directory server. Tries forever when set to\
                 <i>0</i>.'),
    },
    {
      type : 'checkbox',
      name : 'ad_enable_monitor',
      placeholder : T('Enable AD Monitoring'),
      tooltip : T('Set to restart Active Directory automatically if the\
                 service disconnects.'),
    },
    {
      type : 'select',
      name : 'ad_ssl',
      placeholder : T('Encryption Mode'),
      tooltip : T('Choose between <i>Off</i>, <a\
                 href="http://info.ssl.com/article.aspx?id=10241"\
                 target="_blank">SSL</a> or <a\
                 href="https://hpbn.co/transport-layer-security-tls/"\
                 target="_blank">TLS</a>.'),
      options : []
    },
    {
      type : 'select',
      name : 'ad_certificate',
      placeholder : T('Certificate'),
      tooltip : T('Select the certificate of the Active Directory server\
                 if SSL connections are used. Add a certificate here by\
                 creating a <a href="guide" target="_blank">CA</a> then\
                 a certificate on the Active Directory server. Import\
                 the certificate to this system with the <a\
                 href="guide" target="_blank">Certificates</a> menu.'),
      options : []
    },
    {
      type : 'checkbox',
      name : 'ad_verbose_logging',
      placeholder : T('Verbose logging'),
      tooltip : T('Set to log attempts to join the domain to\
                 <b>/var/log/messages</b>.'),
    },
    {
      type : 'checkbox',
      name : 'ad_unix_extensions',
      placeholder : T('UNIX extensions'),
      tooltip : T('<b>Only</b> set if the AD server is explicitly\
                 configured to map permissions for UNIX users. Setting\
                 provides persistent UIDs and GUIDs. Leave unset to map\
                 users and groups to the UID or GUID range configured in\
                 Samba.'),
    },
    {
      type : 'checkbox',
      name : 'ad_allow_trusted_doms',
      placeholder : T('Allow Trusted Domains'),
      tooltip : T('Set when the network has active <a\
                 href="https://technet.microsoft.com/en-us/library/cc757352(WS.10).aspx"\
                 target="_blank">domain/forest trusts</a> and managing\
                 files on multiple domains is required. Setting will\
                 generate more winbind traffic and slow down filtering\
                 through user/group info.'),
    },
    {
      type : 'checkbox',
      name : 'ad_use_default_domain',
      placeholder : T('Use Default Domain'),
      tooltip : T('Unset to prepend the domain name to the username.\
                 Unset to prevent name collisions when <b>Allow Trusted\
                 Domains</b> is set and multiple domains use the same\
                 username.'),
    },
    {
      type : 'checkbox',
      name : 'ad_allow_dns_updates',
      placeholder : T('Allow DNS updates'),
      tooltip : T('Set to enable Samba to do DNS updates when joining a\
                 domain.'),
    },
    {
      type : 'checkbox',
      name : 'ad_disable_freenas_cache',
      placeholder : T('Disable FreeNAS Cache'),
      tooltip : T('Set to disable caching AD users and groups. This can\
                 help when unable to bind to a domain with a large\
                 number of users or groups.'),
    },
    {
      type : 'input',
      name : 'ad_userdn',
      placeholder : T('User Base'),
      tooltip : T('Enter the Distinguished Name (DN) of the user container\
                 in the Active Directory.'),
    },
    {
      type : 'input',
      name : 'ad_groupdn',
      placeholder : T('Group Base'),
      tooltip : T('Enter the Distinguished Name (DN) of the group\
                 container in the Active Directory.'),
    },
    {
      type : 'input',
      name : 'ad_site',
      placeholder : T('Site Name'),
      tooltip : T('Enter the relative distinguished name of the\
                 site object in the Active Directory.'),
    },
    {
      type : 'input',
      name : 'ad_dcname',
      placeholder : T('Domain Controller'),
      tooltip : T('This is automatically added to the SRV record for the\
                 domain. When multiple controllers are specified, this\
                 system selects the closest responding controller. Use a\
                 short form of the FQDN: <i>exampleserver</i>.'),
    },
    {
      type : 'input',
      name : 'ad_gcname',
      placeholder : T('Global Catalog Server'),
      tooltip : T('Ensure the hostname of the global catalog server to use\
                 is resolvable.'),
    },
    {
      type : 'select',
      name : 'ad_kerberos_realm',
      placeholder : T('Kerberos Realm'),
      tooltip : T('Select the realm created in <a href="guide"\
                 target="_blank">Kerberos Realms</a>.'),
      options : []
    },
    {
      type : 'select',
      name : 'ad_kerberos_principal',
      placeholder : T('Kerberos Principal'),
      tooltip : T('Select the keytab created in <a href="guide"\
                 target="_blank">Kerberos Keytabs</a>.'),
      options : []
    },
    {
      type : 'input',
      name : 'ad_timeout',
      placeholder : T('AD Timeout'),
      tooltip : T('Increase number of seconds before timeout if the AD\
                 service does not immediately start after connecting to\
                 the domain.'),
    },
    {
      type : 'input',
      name : 'ad_dns_timeout',
      placeholder : T('DNS Timeout'),
      tooltip : T('Increase the number of seconds before a timeout occurs\
                 if AD DNS queries timeout.'),
    },
    {
      type : 'select',
      name : 'ad_idmap_backend',
      placeholder : T('Idmap backend'),
      tooltip : T('Choose the backend to map Windows security\
                 identifiers (SIDs) to UNIX UIDs and GIDs. Click\
                 <b>Edit</b> to configure that backend.'),
      options : []
    },
    {
      type : 'select',
      name : 'ad_nss_info',
      placeholder : T('Winbind NSS Info'),
      tooltip : T('Choose the schema to use when querying AD for\
                 user/group info. <i>rfc2307</i> uses the schema support\
                 included in Windows 2003 R2, <i>sfu</i> is for\
                 Service For Unix 3.0 or 3.5, and <i>sfu20</i> is for\
                 Service For Unix 2.0.'),
      options : []
    },
    {
      type : 'select',
      name : 'ad_ldap_sasl_wrapping',
      placeholder : T('SASL wrapping'),
      tooltip : T('Choose how LDAP traffic is transmitted. Choices are\
                 <i>plain</i> (plain text), <i>sign</i> (signed only),\
                 or <i>seal</i> (signed and encrypted). Windows 2000 SP3\
                 and newer can be configured to enforce signed LDAP\
                 connections.'),
      options : []
    },
    {
      type : 'checkbox',
      name : 'ad_enable',
      placeholder : T('Enable'),
      tooltip : T('Set to enable the Active Directory service.'),
    },
    {
      type : 'input',
      name : 'ad_netbiosname_a',
      placeholder : 'Netbios Name',
      tooltip : T('Limited to 15 characters. It <b>must</b> differ from\
                 the <i>Workgroup</i> name.'),
    },
    {
      type : 'input',
      name : 'ad_netbiosalias',
      placeholder : T('NetBIOS alias'),
      tooltip : T('Limited to 15 characters.'),
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
      this.idmapBacked = res;
    })
  }
}
