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
import { T } from '../../../../translate-marker';

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
      placeholder : T('Port'),
      tooltip: T('Set the port the FTP service listens on.'),
    },
    {
      type : 'input',
      name : 'ftp_clients',
      placeholder : T('Clients'),
      tooltip: T('The maximum number of simultaneous clients.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ftp_ipconnections',
      placeholder : T('Connections'),
      tooltip: T('Set the maximum number of connections per IP address.\
                  <i>0</i> means unlimited.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ftp_loginattempt',
      placeholder : T('Login Attempts'),
      tooltip: T('Enter the maximum number of attempts before client is\
                  disconnected. Increase this if users are prone to typos.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'ftp_timeout',
      placeholder : T('Timeout'),
      tooltip: T('Maximum client idle time in seconds before client is\
                  disconnected.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'checkbox',
      name : 'ftp_rootlogin',
      placeholder : T('Allow Root Login'),
      tooltip: T('Setting this option is discouraged as it increases security risk.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_onlyanonymous',
      placeholder : T('Allow Anonymous Login'),
      tooltip: T('Set to allow anonymous FTP logins with access to the\
                  directory specified in <b>Path</b>.'),
    },
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name : 'ftp_anonpath',
      placeholder : T('Path'),
      tooltip: T('Set the root directory for anonymous FTP connections.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_onlylocal',
      placeholder : T('Allow Local User Login'),
      tooltip: T('Required if <b>Anonymous Login</b> is disabled.'),
    },
    {
      type : 'textarea',
      name : 'ftp_banner',
      placeholder : T('Display Login'),
      tooltip: T('Specify the message displayed to local login users after\
                  authentication. Not displayed to anonymous login users.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_resume',
      placeholder : T('Allow Transfer Resumption'),
      tooltip: T('Set to allow FTP clients to resume interrupted transfers.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_defaultroot',
      placeholder : T('Always Chroot'),
      tooltip: T('When set, a local user is only allowed access to their home\
                  directory if they are a member of the <i>wheel</i> group.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_reversedns',
      placeholder : T('Perform Reverse DNS Lookups'),
      tooltip: T('Set to perform reverse DNS lookups on client IPs.\
                  This can cause long delays if reverse DNS is not configured.'),
    },
    {
      type : 'input',
      name : 'ftp_masqaddress',
      placeholder : T('Masquerade Address'),
      tooltip: T('Public IP address or hostname. Set if FTP clients\
       c           cannot connect through a NAT device.'),
    },
    {
      type : 'select',
      name : 'ftp_ssltls_certfile',
      placeholder : T('Certificate'),
      tooltip: T('The SSL certificate to be used for TLS FTP connections.\
                  To create a certificate, use <b>System --> Certificates</b>.'),
      options : [],
    },
    {
      type : 'permissions',
      name : 'ftp_filemask',
      placeholder : T('File Permission'),
      tooltip: T('Sets default permissions for newly created files.'),
    },
    {
      type : 'permissions',
      name : 'ftp_dirmask',
      placeholder : T('Directory Permission'),
      tooltip: T('Sets default permissions for newly created directories.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_fxp',
      placeholder : T('Enable FXP'),
      tooltip: T('Set to enable the File eXchange Protocol. This option\
                 makes the server vulnerable to FTP bounce attacks so\
                 it is not recommended.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_ident',
      placeholder : T('Require IDENT Authentication'),
      tooltip: T('Setting this option will result in timeouts if\
                  <b>identd</b> is not running on the client.'),
    },
    {
      type : 'input',
      name : 'ftp_passiveportsmin',
      placeholder : T('Minimum Passive Port'),
      tooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
                  means any port above 1023.'),
    },
    {
      type : 'input',
      name : 'ftp_passiveportsmax',
      placeholder : T('Maximum Passive Port'),
      tooltip: T('Used by clients in PASV mode. A default of <i>0</i>\
                  means any port above 1023.'),
    },
    {
      type : 'input',
      name : 'ftp_localuserbw',
      placeholder : T('Local User Upload Bandwidth'),
      tooltip: T('In KB/s. A default of <i>0</i> means unlimited.'),
    },
    {
      type : 'input',
      name : 'ftp_localuserdlbw',
      placeholder : T('Local User Download Bandwidth'),
      tooltip: T('In KB/s. A default of <i>0</i> means unlimited.'),
    },
    {
      type : 'input',
      name : 'ftp_anonuserbw',
      placeholder : T('Anonymous User Upload Bandwidth'),
      tooltip: T('In KB/s. A default of <i>0</i> means unlimited.'),
    },
    {
      type : 'input',
      name : 'ftp_anonuserdlbw',
      placeholder : T('Anonymous User Download Bandwidth'),
      tooltip: T('In KB/s. A default of <i>0</i> means unlimited.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls',
      placeholder : T('Enable TLS'),
      tooltip: T('Set to enable encrypted connections. Requires a certificate\
                  to be created or imported using\
                  <a href="http://doc.freenas.org/11/system.html#certificates"\
                  target="_blank">Certificates</a>'),
    },
    {
      type : 'select',
      name : 'ftp_tls_policy',
      placeholder : T('TLS Policy'),
      tooltip: T('The selected policy defines whether the control channel,\
                  data channel, both channels, or neither channel of an FTP\
                  session must occur over SSL/TLS. The policies are described\
                  <a href="http://www.proftpd.org/docs/directives/linked/config_ref_TLSRequired.html"\
       target="_blank">here</a>'),
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
      placeholder : T('TLS Allow Client Renegotiations'),
      tooltip: T('Setting this option is <b>not</b> recommended as it\
                  breaks several security measures. Refer to\
                  <a href="http://www.proftpd.org/docs/contrib/mod_tls.html"\
                  target="_blank">mod_tls</a> for more details.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_allow_dot_login',
      placeholder : T('TLS Allow Dot Login'),
      tooltip: T('If set, the user home directory is checked\
                  for a <b>.tlslogin</b> file which contains one or more PEM-encoded\
                  certificates. If not found, the user is prompted for password\
                  authentication.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_allow_per_user',
      placeholder : T('TLS Allow Per User'),
      tooltip: T('If set, the password of the user can be sent\
                  unencrypted.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_common_name_required',
      placeholder : T('TLS Common Name Required'),
      tooltip: T('When set, the common name in the certificate must\
                  match the FQDN of the host.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_enable_diags',
      placeholder : T('TLS Enable Diagnostics'),
      tooltip: T('If set when troubleshooting a connection, logs more\
                  verbosely.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_export_cert_data',
      placeholder : T('TLS Export Certificate Data'),
      tooltip: T('Set to export the certificate environment\
                  variables.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_no_cert_request',
      placeholder : T('TLS No Certificate Request'),
      tooltip : T('Set if the client cannot connect, and\
                   it is suspected the client is poorly handling the\
                   server certificate request.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_no_empty_fragments',
      placeholder : T('TLS No Empty Fragments'),
      tooltip: T('Enabling this option is <b>not</b> recommended as it\
                  bypasses a security mechanism.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_no_session_reuse_required',
      placeholder : T('TLS No Session Reuse Required'),
      tooltip: T('Setting this option reduces the security of the\
                  connection, so only use it if the client does not\
                  understand reused SSL sessions.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_stdenvvars',
      placeholder : T('TLS Export Standard Vars'),
      tooltip: T('If selected, sets several environment variables.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_dns_name_required',
      placeholder : T('TLS DNS Name Required'),
      tooltip: T('If set, the DNS name of the client must resolve to\
                  its IP address and the cert must contain the same DNS name.'),
    },
    {
      type : 'checkbox',
      name : 'ftp_tls_opt_ip_address_required',
      placeholder : T('TLS IP Address Required'),
      tooltip: T('If set, the client certificate must contain\
                  the IP address that matches the IP address of the client.'),
    },
    {
      type : 'textarea',
      name : 'ftp_options',
      placeholder : T('Auxiliary Parameters'),
      tooltip: T('Used to add additional <a href="https://linux.die.net/man/8/proftpd"\
                  target="_blank">proftpd(8)</a> parameters.'),
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
      if (res.length > 0) {
        this.ftp_ssltls_certfile =
            _.find(this.fieldConfig, {'name' : 'ftp_ssltls_certfile'});
        res.forEach((item) => {
          this.ftp_ssltls_certfile.options.push(
              {label : item.name, value : item.id});
        });
      }
    });
  }

  afterInit(entityEdit: any) { }
}
