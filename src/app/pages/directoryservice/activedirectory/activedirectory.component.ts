import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {RestService, SystemGeneralService, WebSocketService} from '../../../services/';
import {FieldConfig} from '../../common/entity/entity-form/models/field-config.interface';
import {  DialogService } from '../../../services/';
import { Validators } from '@angular/forms';
import { T } from "../../../translate-marker";

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
      tooltip : T('Enter the Active Directory administrator account name.'),
      required: true,
      validation : [ Validators.required ],
      disabled: false,
      isHidden:true
    },
    {
      type : 'input',
      name : 'ad_bindpw',
      placeholder : T('Domain Account Password'),
      tooltip : T('Enter the administrator account password.'),
      inputType : 'password',
      togglePw: true,
      required: true,
      validation : [ Validators.required ],
      disabled: false,
      isHidden:true
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
                   /var/log/messages.'),
    },
    {
      type : 'checkbox',
      name : 'ad_unix_extensions',
      placeholder : T('UNIX extensions'),
      tooltip : T('Only set if the AD server is explicitly configured to \
                   map permissions for UNIX users. Setting provides \
                   persistent UIDs and GUIDs. Leave unset to map users \
                   and groups to the UID or GUID range configured in \
                   Samba.'),
    },
    {
      type : 'checkbox',
      name : 'ad_allow_trusted_doms',
      placeholder : T('Allow Trusted Domains'),
      tooltip : T('When set, usernames do not include a domain name.\
                   Unset to force domain names to be prepended to user\
                   names. One possible reason for unsetting this value\
                   is to prevent username collisions when Allow Trusted\
                   Domains is set and there are identical usernames in\
                   more than one domain.'),
    },
    {
      type : 'checkbox',
      name : 'ad_use_default_domain',
      placeholder : T('Use Default Domain'),
      tooltip : T('Unset to prepend the domain name to the username.\
                   Unset to prevent name collisions when Allow Trusted\
                   Domains is set and multiple domains use the same\
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
                   domain. This system selects the closest responding\
                   controller when multiple controllers are specified.\
                   Use a short form of the FQDN: <i>exampleserver</i>.'),
    },
    {
      type : 'input',
      name : 'ad_gcname',
      placeholder : T('Global Catalog Server'),
      tooltip : T('This holds a full set of attributes for the domain in\
                   which it resides and a subset of attributes for all\
                   objects in the Microsoft Active Directory Forest. The\
                   primary two functions of a Global Catalog within the\
                   Microsoft Active Directory are logon capability and\
                   Microsoft Active Directory queries. See <a\
                   href="https://www.ibm.com/support/knowledgecenter/en/SSEQTP_9.0.0/com.ibm.websphere.base.doc/ae/csec_was_ad_globcat.html"\
                   target="_blank">IBM Knowledge Center</a> for more\
                   details.'),
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
      options : [
        {label : '---', value : ""},
      ]
    },
    {
      type : 'input',
      name : 'ad_timeout',
      placeholder : T('AD Timeout'),
      tooltip : T('Number of seconds before timeout. If the AD service\
                   does not immediately start after connecting to the\
                   domain, increase this value.'),
    },
    {
      type : 'input',
      name : 'ad_dns_timeout',
      placeholder : T('DNS Timeout'),
      tooltip : T('Number of seconds before a timeout. Increase this\
                   value if AD DNS queries time out.'),
    },
    {
      type : 'select',
      name : 'ad_idmap_backend',
      placeholder : T('Idmap backend'),
      tooltip : T('Choose the backend to map Windows security\
                   identifiers (SIDs) to UNIX UIDs and GIDs. Click\
                   Edit to configure that backend.'),
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
      tooltip : T('Netbios Name of this NAS. This name must differ from\
                   the <i>Workgroup</i> name and be no greater than 15\
                   characters.'),
    },
    {
      type : 'input',
      name : 'ad_netbiosalias',
      placeholder : T('NetBIOS alias'),
      tooltip : T('Alternative names that SMB clients can use when\
                   connecting to this NAS. Can be no greater than 15\
                   characters.'),
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
        this.dialogservice.confirm(T("Active Directory IDMAP change!"),
          T('<font color="red">WARNING</font>: use <i>rid</i> or\
             <i>autorid</i> for networks with only Windows computers,\
             like most home networks. Mac computers joined to Active\
             Directory can also be used with <i>rid</i> and\
             <i>autorid</i>. Both of these backends have been\
             preconfigured to work with this NAS. Other idmap_backend\
             values are for use in larger or mixed networks with Windows\
             and other operating systems. DO NOT CHANGE THE idmap_backend\
             SETTING UNLESS REQUIRED TO WORK WITH A MIXED NETWORK AND THE\
             PROPER CONFIGURATION HAS ALREADY BEEN DETERMINED. For\
             reference, see <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_rid"\
             target="_blank">idmap_rid(8)</a>, <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_autorid"\
             target="_blank">idmap_autorid(8)</a>\, <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_ad"\
             target="_blank">ad</a>\, <a\
             href="%%docurl%%/directoryservice.html%%webversion%%#id12"\
             target="_blank">fruit</a>\, <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_ldap"\
             target="_blank">idmap_ldap(8)</a>\, <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_nss"\
             target="_blank">idmap_nss(8)</a>\, <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_rfc2307"\
             target="_blank">idmap_rfc2307(8)\, <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_script"\
             target="_blank">idmap_script(8)</a>\, <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_tdb"\
             target="_blank">tdb</a>\, and <a\
             href="https://www.freebsd.org/cgi/man.cgi?query=idmap_tdb2"\
             target="_blank">idmap_tdb2(8)</a>')).subscribe(
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
