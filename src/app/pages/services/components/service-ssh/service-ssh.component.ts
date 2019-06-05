import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { NetworkService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-ssh';

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
      placeholder : helptext.ssh_bindiface_placeholder,
      tooltip: helptext.ssh_bindiface_tooltip,
      multiple : true,
      options : []
    },
    {
      type : 'input',
      name : 'ssh_tcpport',
      placeholder : helptext.ssh_tcpport_placeholder,
      tooltip: helptext.ssh_tcpport_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ssh_rootlogin',
      placeholder : helptext.ssh_rootlogin_placeholder,
      tooltip: helptext.ssh_rootlogin_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ssh_passwordauth',
      placeholder : helptext.ssh_passwordauth_placeholder,
      tooltip: helptext.ssh_passwordauth_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ssh_kerberosauth',
      placeholder : helptext.ssh_kerberosauth_placeholder,
      tooltip: helptext.ssh_kerberosauth_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ssh_tcpfwd',
      placeholder : helptext.ssh_tcpfwd_placeholder,
      tooltip: helptext.ssh_tcpfwd_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ssh_compression',
      placeholder : helptext.ssh_compression_placeholder,
      tooltip: helptext.ssh_compression_tooltip,
    },
    {
      type : 'select',
      name : 'ssh_sftp_log_level',
      placeholder : helptext.ssh_sftp_log_level_placeholder,
      tooltip: helptext.ssh_sftp_log_level_tooltip,
      options : helptext.ssh_sftp_log_level_options,
    },
    {
      type : 'select',
      name : 'ssh_sftp_log_facility',
      placeholder : helptext.ssh_sftp_log_facility_placeholder,
      tooltip: helptext.ssh_sftp_log_facility_tooltip,
      options : helptext.ssh_sftp_log_facility_options,
    },
    {
      type : 'textarea',
      name : 'ssh_options',
      placeholder : helptext.ssh_options_placeholder,
      tooltip: helptext.ssh_options_tooltip,
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
    this.ws.call('ssh.bindiface_choices').subscribe((res) => {
      const values = Object.values(res);
      this.ssh_bindiface = _.find(this.fieldConfig, {'name' : 'ssh_bindiface'});
      values.forEach((item) => {
        this.ssh_bindiface.options.push({label : item, value : item});
      });
    });
  }
}
