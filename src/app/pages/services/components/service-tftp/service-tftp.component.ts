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
  selector : 'tftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceTFTPComponent {

  protected resource_name: string = 'services/tftp';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'tftp_directory',
      placeholder : 'Directory',
      tooltip : 'Browse to an <b>existing</b> directory to be used for\
 storage. Some devices require a specific directory name. Refer to the\
 device documentation for more details.',
    },
    {
      type : 'checkbox',
      name : 'tftp_newfiles',
      placeholder : 'Allow New Files',
      tooltip : 'Enable this if network devices need to send files to\
 the system.',
    },
    {
      type : 'input',
      name : 'tftp_port',
      placeholder : 'Port',
      tooltip : 'Enter a UDP prort to listen for TFTP requests.',
    },
    {
      type : 'select',
      name : 'tftp_username',
      placeholder : 'Username',
      tooltip : 'Select the account to use for TFTP requests. This\
 account must have permission to the <b>Directory</b>.',
      options : [
        {label : '', value : ''},
        {label : 'null', value : ''},
      ]
    },
    {
      type : 'permissions',
      name : 'tftp_umask',
      placeholder : 'Umask',
      tooltip : 'umask for newly created files. Adjust the permissions\
 using the checkboxes.',
    },
    {
      type : 'textarea',
      name : 'tftp_options',
      placeholder : 'Extra options',
      tooltip : 'Add more options from\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=tftpd" target="_blank">tftpd(8)</a>.\
 Add one option per line.',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) { }
}
