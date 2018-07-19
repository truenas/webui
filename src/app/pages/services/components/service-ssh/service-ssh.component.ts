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
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../services';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'ssh-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ NetworkService ],
})

export class ServiceSSHComponent implements OnInit {
  // Form Layout
  protected resource_name: string = 'services/ssh';
  protected isBasicMode: boolean = true;
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ssh_bindiface',
      placeholder : T('Bind Interfaces'),
      tooltip: T('Select interfaces for SSH to listen on. Leave all\
                  options unselected for SSH to listen on all interfaces.'),
      multiple : true,
      options : []
    },
    {
      type : 'input',
      name : 'ssh_tcpport',
      placeholder : T('TCP Port'),
      tooltip: 'Open a port for SSH connection requests.',
    },
    {
      type : 'checkbox',
      name : 'ssh_rootlogin',
      placeholder : T('Login as Root with Password'),
      tooltip: T('<b>Root logins are discouraged.</b> Set to allow root\
                  logins. A password must be set for the <i>root</i>\
                  user in <a href="..//docs/account.html#users"\
                  target="_blank">Users</a>.'),
    },
    {
      type : 'checkbox',
      name : 'ssh_passwordauth',
      placeholder : T('Allow Password Authentication'),
      tooltip: T('Unset to require key-based authentication for\
                  all users. This requires <a\
                  href="http://the.earth.li/%7Esgtatham/putty/0.55/htmldoc/Chapter8.html"\
                  target="_blank">additional setup</a> on both the SSH\
                  client and server.'),
    },
    {
      type : 'checkbox',
      name : 'ssh_kerberosauth',
      placeholder : T('Allow Kerberos Authentication'),
      tooltip: T('Ensure <a\
                  href="..//docs/directoryservice.html#kerberos-realms"\
                  target="_blank">Kerberos Realms</a> and <a\
                  href="..//docs/directoryservice.html#kerberos-keytabs"\
                  target="_blank">Kerberos Keytabs</a> are configured\
                  and the system can communicate with the Kerberos\
                  Domain Controller before setting.'),
    },
    {
      type : 'checkbox',
      name : 'ssh_tcpfwd',
      placeholder : T('Allow TCP Port Forwarding'),
      tooltip: T('Set to allow users to bypass firewall restrictions\
                  using the SSH port <a\
                  href="https://www.symantec.com/connect/articles/ssh-port-forwarding"\
                  target="_blank">forwarding feature</a>.'),
    },
    {
      type : 'checkbox',
      name : 'ssh_compression',
      placeholder : T('Compress Connections'),
      tooltip: T('Set to attempt to reduce latency over slow networks.'),
    },
    {
      type : 'select',
      name : 'ssh_sftp_log_level',
      placeholder : T('SFTP Log Level'),
      tooltip: T('Select the <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=syslog"\
                  target="_blank">syslog(3)</a> level of the SFTP server.'),
      options : [
        {label : '', value : ''},
        {label : 'Quiet', value : 'QUIET'},
        {label : 'Fatal', value : 'FATAL'},
        {label : 'Error', value : 'ERROR'},
        {label : 'Info', value : 'INFO'},
        {label : 'Verbose', value : 'VERBOSE'},
        {label : 'Debug', value : 'DEBUG'},
        {label : 'Debug2', value : 'DEBUG2'},
        {label : 'Debug3', value : 'DEBUG3'},
      ],
    },
    {
      type : 'select',
      name : 'ssh_sftp_log_facility',
      placeholder : T('SFTP Log Facility'),
      tooltip: T('Select the <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=syslog"\
                  target="_blank">syslog(3)</a> facility of the SFTP\
                  server.'),
      options : [
        {label : '', value : ''},
        {label : 'Daemon', value : 'DAEMON'},
        {label : 'User', value : 'USER'},
        {label : 'Auth', value : 'AUTH'},
        {label : 'Local 0', value : 'LOCAL0'},
        {label : 'Local 1', value : 'LOCAL1'},
        {label : 'Local 2', value : 'LOCAL2'},
        {label : 'Local 3', value : 'LOCAL3'},
        {label : 'Local 4', value : 'LOCAL4'},
        {label : 'Local 5', value : 'LOCAL5'},
        {label : 'Local 6', value : 'LOCAL6'},
        {label : 'Local 7', value : 'LOCAL7'},
      ],
    },
    {
      type : 'textarea',
      name : 'ssh_options',
      placeholder : T('Extra options'),
      tooltip: T('Add any more <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=sshd_config"\
                  target="_blank">sshd_config(5)</a> options not covered\
                  in this screen. Enter one option per line. These\
                  options are case-sensitive. Misspellings can prevent\
                  the SSH service from starting.'),
    },
  ];
  protected advanced_field: Array<any> = [
    'ssh_bindiface',
    'ssh_kerberosauth',
    'ssh_sftp_log_level',
    'ssh_sftp_log_facility',
    'ssh_options',
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
  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected networkService: NetworkService,
  ) {}

  afterInit(entityEdit: any) { }

  protected ssh_bindiface: any;
  ngOnInit() {
    this.networkService.getAllNicChoices().subscribe((res) => {
      this.ssh_bindiface = _.find(this.fieldConfig, {'name' : 'ssh_bindiface'});
      res.forEach((item) => {
        this.ssh_bindiface.options.push({label : item[0], value : item[0]});
      });
    });
  }
}
