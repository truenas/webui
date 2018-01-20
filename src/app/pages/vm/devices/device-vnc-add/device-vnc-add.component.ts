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
      tooltip : 'Can be set to <i>0</i>, left empty for FreeNAS to\
 assign a port when the VM is stared, or set to a fixed,preferred port\
 number.',
      type : 'input',
      inputType: 'number'
    },
    {
      name : 'VNC_wait',
      placeholder : 'wait on boot',
      tooltip : 'When checked, VNC client should wait until the VM has\
 booted before attempting the connection.',
      type: 'checkbox'
    },
    {
      name : 'VNC_resolution',
      placeholder : 'Resolution:',
      tooltip : 'Used to modify the default screen resolution used by\
 the VNC session.',
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
      tooltip : 'By default, VNC binds to all available IP addresses\
 (<i>0.0.0.0). To specify the IP address to use, select it.',
      type: 'select',
      options : [],
    },
    {
      name : 'vnc_password',
      placeholder : 'password',
      tooltip : 'Enter the VNC password to automatically pass the VNC.\
 Note that the password is limited to 8 characters.',
      type : 'input',
      inputType : 'password',
    },
    {
      name : 'vnc_web',
      placeholder : 'VNC web',
      tooltip : 'When checked, uses the VNC web interface.',
      type: 'checkbox'
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
        for (let item of res){
          this.ipAddress.options.push({label : item[1], value : item[0]});
        }
      }
    })
  }
  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService,
             ) {}
}
