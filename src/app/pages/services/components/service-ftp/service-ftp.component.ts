import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';


import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'ftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class ServiceFTPComponent implements OnInit {
  protected resource_name: string = 'services/ftp';
  protected route_success: string[] = [ 'services' ];

  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'ftp_port',
      placeholder : 'Port',
      tooltip: 'Port the FTP service listens on.',
    },
    {
      type : 'input',
      name : 'ftp_clients',
      placeholder : 'Clients',
      tooltip: 'Maximum number of simultaneous clients.',
    },
    {
      type : 'input',
      name : 'ftp_ipconnections',
      placeholder : 'Connections',
      tooltip: 'Maximum number of connections per IP address where\
 <i>0</i> means unlimited.',
    },
    {
      type : 'input',
      name : 'ftp_loginattempt',
      placeholder : 'Login Attempts',
      tooltip: 'Maximum number of attempts before client is\
 disconnected. Increase this if users are prone to typos.',
    },
    {
      type : 'input',
      name : 'ftp_timeout',
      placeholder : 'Timeout',
      tooltip: 'Maximum client idle time in seconds before client is\
 disconnected.',
    },
    {
      type : 'checkbox',
      name : 'ftp_rootlogin',
      placeholder : 'Allow Root Login',
      tooltip: 'Discouraged as it increases security risk.',
    },
    {
      type : 'checkbox',
      name : 'ftp_onlyanonymous',
      placeholder : 'Allow Anonymous Login',
      tooltip: 'Enables anonymous FTP logins with access to the\
 directory specified in <b>Path</b>.',
    },
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name : 'ftp_anonpath',
      placeholder : 'Path',
      tooltip: 'Root directory for anonymous FTP connections.',
    },
    {
      type : 'checkbox',
      name : 'ftp_onlylocal',
      placeholder : 'Allow Local User Login',
      tooltip: 'Required if <b>Anonymous Login</b> is disabled.',
    },
    {
      type : 'textarea',
      name : 'ftp_banner',
      placeholder : 'Display Login',
      tooltip: 'Message displayed to local login users after\
 authentication. Not displayed to anonymous login users.',
    },
    {
      type : 'checkbox',
      name : 'ftp_resume',
      placeholder : 'Allow Transfer Resumption',
      tooltip: 'Allows FTP clients to resume interrupted transfers.',
    },
    {
      type : 'checkbox',
      name : 'ftp_defaultroot',
      placeholder : 'Always Chroot',
      tooltip: 'A local user is only allowed access to their home\
 directory unless the user is a member of gorup <i>wheel</i>.',
    },
    {
      type : 'checkbox',
      name : 'ftp_reversedns',
      placeholder : 'Perform Reverse DNS Lookups',
      tooltip: 'Perform reverse DNS lookups on client IPs. Can cause\
 long delays if reverse DNS is not configured.',
    },
    {
      type : 'input',
      name : 'ftp_masqaddress',
      placeholder : 'Masquerade Address',
      tooltip: 'Public IP address or hostname. Set if FTP clients\
 cannot connect through a NAT device.',
    },
    {
      type : 'select',
      name : 'ftp_ssltls_certfile',
      placeholder : 'Certificate',
      tooltip: 'The SSL certificate to be used for TLS FTP connections.\
 To create a certificate, use <b>System -> Certificates</b>.',
      options : [],
    },
    {
      type : 'permissions',
      name : 'ftp_filemask',
      placeholder : 'File Permission',
      tooltip: 'Sets default permissions for newly created files.',
    },
    {
      type : 'permissions',
      name : 'ftp_dirmask',
      placeholder : 'Directory Permission',
      tooltip: 'Sets defualt permissions for newly created directories.',
    },
    {
      type : 'checkbox',
      name : 'ftp_fxp',
      placeholder : 'Enable FXP',
      tooltip: 'Enables File eXchange Protocol which is discouraged as\
 it makes the server vulnerable to FTP bounce attacks.',
    },
    {
      type : 'checkbox',
      name : 'ftp_ident',
      placeholder : 'Require IDENT Authentication',
      tooltip: 'Will result in timeouts if <b>identd</b> is not running\
 on the client.',
    },
    {
      type : 'input',
      name : 'ftp_passiveportsmin',
      placeholder : 'Minimum Passive Port',
      tooltip: 'Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.',
    },
    {
      type : 'input',
      name : 'ftp_passiveportsmax',
      placeholder : 'Maximum Passive Port',
      tooltip: 'Used by clients in PASV mode. A default of <i>0</i>\
 means any port above 1023.',
    },
    {
      type : 'input',
      name : 'ftp_localuserbw',
      placeholder : 'Local User Upload Bandwidth',
      tooltip: 'In KB/s. A default of <i>0</i> means unlimited.',
    },
    {
      type : 'input',
      name : 'ftp_localuserdlbw',
      placeholder : 'Local User Download Bandwidth',
      tooltip: 'In KB/s. A default of <i>0</i> means unlimited.',
    },
    {
      type : 'input',
      name : 'ftp_anonuserbw',
      placeholder : 'Anonymous User Upload Bandwidth',
      tooltip: 'In KB/s. A default of <i>0</i> means unlimited.',
    },
    {
      type : 'input',
      name : 'ftp_anonuserdlbw',
      placeholder : 'Anonymous User Download Bandwidth',
      tooltip: 'In KB/s. A default of <i>0</i> means unlimited.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls',
      placeholder : 'Enable TLS',
      tooltip: 'Enables encrypted connections and requires a certificate\
 to be created or imported using\
 <a href="http://doc.freenas.org/11/system.html#certificates"\
 target="_blank">Certificates</a>',
    },
    {
      type : 'select',
      name : 'ftp_tls_policy',
      placeholder : 'TLS Policy',
      tooltip: 'The selected policy defines whether the control channel,\
 data channel, both channels, or neither channel of an FTP session must\
 occur over SSL/TLS. The policies are described <a\
 href="http://www.proftpd.org/docs/directives/linked/config_ref_TLSRequired.html"\
 target="_blank">here</a>',
      options : [
        {label : 'On', value : 'on'},
        {label : 'Off', value : 'off'},
        {label : 'Data', value : 'data'},
        {label : '!Data', value : '!data'},
        {label : 'Auth', value : 'auth'},
        {label : 'Ctrl', value : 'ctrl'},
        {label : 'Ctrl + Data', value : 'ctrl+data'},
        {label : 'Ctrl + !Data', value : 'ctrl+!data'},
        {label : 'Auth + Data', value : 'auth+data'},
        {label : 'Auth + !Data', value : 'auth+!data'},
      ],
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_allow_client_renegotiations',
      placeholder : 'TLS Allow Client Renegotiations',
      tooltip: 'Checking this box is <b>not</b> recommended as it\
 breaks several security measures. For this and the rest of the TLS\
 fields, refer to\
 <a href="http://www.proftpd.org/docs/contrib/mod_tls.html"\
 target="_blank">mod_tls</a> for more details.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_allow_dot_login',
      placeholder : 'TLS Allow Dot Login',
      tooltip: 'If checked, the home directory of the user is checked\
 for a <b>.tlslogin</b> file which contains one or more PEM-encoded\
 certificates. If not found, the user is prompted for password\
 authentication.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_allow_per_user',
      placeholder : 'TLS Allow Per User',
      tooltip: 'If checked, the password of the user may be sent\
 unencrypted.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_common_name_required',
      placeholder : 'TLS Common Name Required',
      tooltip: 'If checked, the common name in the certificate must\
 match the FQDN of the host.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_enable_diags',
      placeholder : 'TLS Enable Diagnostics',
      tooltip: 'If checked when troubleshooting a connection, logs more\
 verbosely.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_export_cert_data',
      placeholder : 'TLS Export Certificate Data',
      tooltip: 'If checked, exports the certificate environment\
 variables.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_no_cert_request',
      placeholder : 'TLS No Certificate Request',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_no_empty_fragments',
      placeholder : 'TLS No Empty Fragments',
      tooltip: 'Checking this box is <b>not</b> recommended as it\
 bypasses a security mechanism.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_no_session_reuse_required',
      placeholder : 'TLS No Session Reuse Required',
      tooltip: 'Checking this box reduces the security of the\
 connection, so only use it if the client does not understand reused\
 SSL sessions.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_stdenvvars',
      placeholder : 'TLS Export Standard Vars',
      tooltip: 'If checked, sets several environment variables.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_dns_name_required',
      placeholder : 'TLS DNS Name Required',
      tooltip: 'If checked, the DNS name of the client must resolve to\
 its IP address and the cert must contain the same DNS name.',
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_ip_address_required',
      placeholder : 'TLS IP Address Required',
      tooltip: 'If checked, the certificate of the client must contain\
 the IP address that matches the IP address of the client.',
    },
    {
      type : 'textarea',
      name : 'ftp_options',
      placeholder : 'Auxiliary Parameters',
      tooltip: 'Used to add <a href="https://linux.die.net/man/8/proftpd"\
 target="_blank">proftpd(8)</a> parameters not covered elsewhere in\
 this screen.',
    },
  ];

  protected advanced_field: Array<any> = [
    'ftp_filemask',
    'ftp_dirmask',
    'ftp_fxp',
    'ftp_ident',
    'ftp_passiveportsmin',
    'ftp_passiveportsmax',
    'ftp_localuserbw',
    'ftp_localuserdlbw',
    'ftp_anonuserbw',
    'ftp_anonuserdlbw',
    'ftp_tls',
    'ftp_tls_policy',
    'ftp_tls_opt_allow_client_renegotiations',
    'ftp_tls_opt_allow_dot_login',
    'ftp_tls_opt_allow_per_user',
    'ftp_tls_opt_common_name_required',
    'ftp_tls_opt_enable_diags',
    'ftp_tls_opt_export_cert_data',
    'ftp_tls_opt_no_empty_fragments',
    'ftp_tls_opt_no_session_reuse_required',
    'ftp_tls_opt_stdenvvars',
    'ftp_tls_opt_dns_name_required',
    'ftp_tls_opt_ip_address_required',
    'ftp_options'
  ];
  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
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

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,

              protected systemGeneralService: SystemGeneralService) {}

  private ftp_ssltls_certfile: any;

  ngOnInit() {
    this.systemGeneralService.getCertificates().subscribe((res) => {
      this.ftp_ssltls_certfile =
          _.find(this.fieldConfig, {'name' : 'ftp_ssltls_certfile'});
      res.data.forEach((item) => {
        this.ftp_ssltls_certfile.options.push(
            {label : item.cert_common, value : item.id});
      });
    });
  }

  afterInit(entityEdit: any) { }
}
