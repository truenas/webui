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

import {GlobalState} from '../../../global.state';
import {RestService, UserService, WebSocketService} from '../../../services/';
import {EntityConfigComponent} from '../../common/entity/entity-config/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-advanced',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AdvancedComponent {
  protected resource_name: string = 'system/advanced';
  private entityEdit: EntityConfigComponent;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'checkbox',
      name : 'adv_consolemenu',
      placeholder : 'Enable Console Menu',
    },
    {
      type : 'checkbox',
      name : 'adv_serialconsole',
      placeholder : 'Enable Serial Console',
    },
    {
      type : 'select',
      name : 'adv_serialport',
      placeholder : 'Serial Port',
      options : []
    },
    {
      type : 'input',
      name : 'adv_swapondrive',
      placeholder :
          'Swap size on each drive in GiB, affects new disks only. Setting this to 0 disables swap creation completely (STRONGLY DISCOURAGED).',
    },
    {
      type : 'select',
      name : 'adv_serialspeed',
      placeholder : 'Serial Speed',
      options : [
        {label : '9600', value : "9600"},
        {label : '19200', value : "19200"},
        {label : '38400', value : "38400"},
        {label : '57600', value : "57600"},
        {label : '115200', value : "115200"},
      ],
    },
    {
      type : 'checkbox',
      name : 'adv_consolescreensaver',
      placeholder : 'Enable Console Screensaver',
    },
    {
      type : 'checkbox',
      name : 'adv_powerdaemon',
      placeholder : 'Enable Power Saving Daemon',
    },
    {
      type : 'checkbox',
      name : 'adv_autotune',
      placeholder : 'Enable autotune',
    },
    {
      type : 'checkbox',
      name : 'adv_debugkernel',
      placeholder : 'Enable Debug Kernel',
    },
    {
      type : 'checkbox',
      name : 'adv_consolemsg',
      placeholder : 'Show console messages in the footer',
    },
    {
      type : 'textarea',
      name : 'adv_motd',
      placeholder : 'MOTD Banner',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected _injector: Injector,
              protected _appRef: ApplicationRef) {}

  afterInit(entityEdit: any) {
    entityEdit.ws.call('device.get_info', [ 'SERIAL' ]).subscribe((res) => {
      let adv_serialport =
          _.find(this.fieldConfig, {'name' : 'adv_serialport'});
      res.forEach((item) => {
        adv_serialport.options.push(
            {label : item.name + ' (' + item.start + ')', value : item.start});
      });
    });
  }
}
