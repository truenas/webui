import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, SystemGeneralService} from '../../../../services/';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component ({
    selector: 'ssh-edit',
    template: `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceSSHComponent {
  // Form Layout
  protected resource_name: string = 'services/ssh';
  protected isBasicMode: boolean = true;
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected fieldConfig: FieldConfig[] = [
    {
        type: 'select',
        name: 'ssh_bindiface',
        placeholder: 'Bind Interfaces',
        multiple: true
        options: [
        ]
    },
    {
        type: 'input',
        name: 'ssh_tcpport',
        placeholder: 'TCP Port',
    },
    {
        type: 'checkbox',
        name: 'ssh_rootlogin',
        placeholder: 'Login as Root with password',
    },
    {
        type: 'checkbox',
        name: 'ssh_passwordauth',
        placeholder: 'Allow Password Authentication',
    },
    {
        type: 'checkbox',
        name: 'ssh_kerberosauth',
        placeholder: 'Allow Kerberos Authentication',
    },
    {
        type: 'checkbox',
        name: 'ssh_tcpfwd',
        placeholder: 'Allow TCP Port Forwarding',
    },
    {
        type: 'checkbox',
        name: 'ssh_compression',
        placeholder: 'Compress Connections',
    },
    {
        type: 'select',
        name: 'ssh_sftp_log_level',
        placeholder: 'SFTP Log Level',
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
    },
    {
        type: 'select',
        name: 'ssh_sftp_log_facility',
        placeholder: 'SFTP Log Facility',
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
          { label: 'Local 7', value: 'LOCAL7' },
        ],
    },
    {
        type: 'textarea',
        name: 'ssh_options',
        placeholder: 'Extra options',
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
  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState
  ) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



