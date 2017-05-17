import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'ssh-edit',
    template: ` <entity-config [conf]="this"></entity-config>`,
})

export class ServiceSSHComponent {
  // Form Layout
  protected resource_name: string = 'services/ssh';
  protected isBasicMode: boolean = true;
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected formModel: DynamicFormControlModel[] = [
      new DynamicInputModel({
        id: 'ssh_bindiface',
        label: 'Bind Interfaces',
    }),
    new DynamicInputModel({
        id: 'ssh_tcpport',
        label: 'TCP Port',
    }),
    new DynamicCheckboxModel({
      id: 'ssh_rootlogin',
      label: 'Login as Root with password',
    }),
    new DynamicCheckboxModel({
      id: 'ssh_passwordauth',
      label: 'Allow Password Authentication',
    }),
   new DynamicCheckboxModel({
      id: 'ssh_kerberosauth',
      label: 'Allow Kerberos Authentication',
    }),
      new DynamicCheckboxModel({
      id: 'ssh_tcpfwd',
      label: 'Allow TCP Port Forwarding',
    }),
    new DynamicCheckboxModel({
      id: 'ssh_compression',
      label: 'Compress Connections',
    }),
   new DynamicSelectModel({
      id: 'ssh_sftp_log_level',
      label: 'SFTP Log Level',
      options: [
        { label: '', value: '' },
        { label: 'Quiet', value: 'QUIET' },
        { label: 'Fatal', value: 'FATAL' },
        { label: 'Error', value: 'ERROR' },
         { label: 'Info', value: 'INFO' },
         { label: 'Verbose', value: 'VERBOSE' },
         { label: 'Debug', value: 'DEBUG' },
         { label: 'Debug2', value: 'DEBUG2' },
         { label: 'Debug3', value: 'DEBUG3' },
      ],
    }),
    new DynamicSelectModel({
      id: 'ssh_sftp_log_facility',
      label: 'SFTP Log Facility',
      options: [
        { label: '', value: '' },
        { label: 'Daemon', value: 'DAEMON' },
        { label: 'User', value: 'USER' },
        { label: 'Auth', value: 'AUTH' },
        { label: 'Local 0', value: 'LOCAL0' },
        { label: 'Local 1', value: 'LOCAL1' },
        { label: 'Local 2', value: 'LOCAL2' },
        { label: 'Local 3', value: 'LOCAL3' },
        { label: 'Local 4', value: 'LOCAL4' },
        { label: 'Local 5', value: 'LOCAL5' },
        { label: 'Local 6', value: 'LOCAL6' },
        { label: 'Local 7', value: 'LOCAL7 ' },
      ],
    }),
    new DynamicTextAreaModel({
        id: 'ssh_options',
        label: 'Extra options',
    }),
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

  protected custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      'id': 'advanced_mode',
      name: 'Advanced Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];
 constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



