import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService, SystemGeneralService} from '../../../../services/';
import * as _ from 'lodash';

@Component({
  selector : 'app-device-vnc-add',
  template : `<device-add [conf]="this"></device-add>`,
  providers : [ SystemGeneralService ]
})
export class DeviceVncAddComponent {

  protected resource_name: string = 'vm/device';
  protected pk: any;
  protected route_success: string[];
  public vm: string;
  public ipAddress: any = [];
public fieldConfig: FieldConfig[]  = [
    {
      name : 'VNC_port',
      placeholder : 'port',
      type : 'input',
      inputType: 'number'
    },
    {
      name : 'VNC_wait',
      placeholder : 'wait on boot',
      type: 'checkbox'
    },
    {
      name : 'VNC_resolution',
      placeholder : 'Resolution:',
      type: 'select',
      options : [
        {label : '1920x1080', value : "1920x1080"},
        {label : '1400x1050', value : "1400x1050"},
        {label : '1280x1024', value : "1280x1024"},
        {label : '1280x960', value : "1280x960"},
        {label : '1024x768', value : '1024x768'},
        {label : '800x600', value : '800x600'},
        {label : '640x480', value : '640x480'},
      ],
    },
    {
      name : 'vnc_bind',
      placeholder : 'Bind:',
      type: 'select',
      options : [],
    },
    {
      name : 'vnc_password',
      placeholder : 'password',
      type : 'input',
      inputType : 'password',
    },
  ];
  protected dtype: string = 'VNC';
  afterInit() {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_success = [ 'vm', this.pk, 'devices', this.vm ];
    });
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        this.ipAddress = _.find(this.fieldConfig, {'name' : 'vnc_bind'});
        res.forEach((item) => {
          this.ipAddress.options.push({label : item[1], value : item[0]});
        });
      }
    })
  }
  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService,
              protected _state: GlobalState) {}
}
