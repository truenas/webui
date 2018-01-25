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
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

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
      placeholder : 'Bind Interfaces',
      tooltip: 'By default, SSH listens on all interfaces unless\
 specific interfaces are chosen in the drop-down menu by checking the box.',
      multiple : true,
      options : []
    },
    {
      type : 'input',
      name : 'ssh_tcpport',
      placeholder : 'TCP Port',
      tooltip: 'Port to open for SSH connection requests; <i>22</i> by default.',
    },
    {
      type : 'checkbox',
      name : 'ssh_rootlogin',
      placeholder : 'Login as Root with password',
      tooltip: '<b>For security reasons, root logins are\
  discouraged and disabled by default.</b> If enabled, password must be\
  set for <i>root</i> user in <strong>Users</strong>.',
    },
    {
      type : 'checkbox',
      name : 'ssh_passwordauth',
      placeholder : 'Allow Password Authentication',
      tooltip: 'If unchecked, key-based authentication for all\
 users is needed; requires <a href="http://the.earth.li/%7Esgtatham/putty/0.55/htmldoc/Chapter8.html" target="_blank">additional setup</a>\
 on both the SSH client and server.',
    },
    {
      type : 'checkbox',
      name : 'ssh_kerberosauth',
      placeholder : 'Allow Kerberos Authentication',
      tooltip: 'Before checking this box, ensure <a href="http://doc.freenas.org/11/directoryservice.html#kerberos-realms" target="_blank">Kerberos Realms<a>\
 and <a href="http://doc.freenas.org/11/directoryservice.html#kerberos-keytabs" target="_blank">Kerberos Keytabs</a>\
 have been configured and that the FreeNAS® system can communicate with the KDC.',
    },
    {
      type : 'checkbox',
      name : 'ssh_tcpfwd',
      placeholder : 'Allow TCP Port Forwarding',
      tooltip: 'Allows users to bypass firewall restrictions using\
 SSH’s port <a href="https://www.symantec.com/connect/articles/ssh-port-forwarding" target="_blank">forwarding feature</a>.',
    },
    {
      type : 'checkbox',
      name : 'ssh_compression',
      placeholder : 'Compress Connections',
      tooltip: 'May reduce latency over slow networks.',
    },
    {
      type : 'select',
      name : 'ssh_sftp_log_level',
      placeholder : 'SFTP Log Level',
      tooltip: 'Select the <a href="https://www.freebsd.org/cgi/man.cgi?query=syslog" target="_blank">syslog(3)</a>\
 level of the SFTP server.',
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
      placeholder : 'SFTP Log Facility',
      tooltip: 'Select the <a href="https://www.freebsd.org/cgi/man.cgi?query=syslog" target="_blank">syslog(3)</a>\
 facility of the SFTP server.',
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
      placeholder : 'Extra options',
      tooltip: 'Additional <a href="https://www.freebsd.org/cgi/man.cgi?query=sshd_config" target="_blank">sshd_config(5)</a>\
 options not covered in this screen, one per line; these options are\
 case-sensitive and misspellings may prevent the SSH service from starting.',
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
