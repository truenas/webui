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

  protected resource_name = 'vm/device';
  protected pk: any;
  protected route_success: string[];
  public vm: string;
  public ipAddress: any = [];
public fieldConfig: FieldConfig[]  = [
    {
      name : 'VNC_port',
      placeholder : 'Port',
      tooltip : 'Can be set to <i>0</i>, left empty for FreeNAS to\
                 assign a port when the VM is started, or set to a\
                 fixed, preferred port number.',
      type : 'input',
      inputType: 'number'
    },
    {
      name : 'VNC_wait',
      placeholder : 'Wait to boot',
      tooltip : 'Set for the VNC client to wait until the VM has\
                 booted before attempting the connection.',
      type: 'checkbox'
    },
    {
      name : 'VNC_resolution',
      placeholder : 'Resolution',
      tooltip : 'Select a screen resolution to use for VNC sessions.',
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
      placeholder : 'Bind',
      tooltip : 'Select an IP address to use for VNC sessions.',
      type: 'select',
      options : [],
    },
    {
      name : 'vnc_password',
      placeholder : 'Password',
      tooltip : 'Enter a VNC password to automatically pass to the\
                 VNC session. Passwords cannot be longer than 8\
                 characters.',
      type : 'input',
      inputType : 'password',
    },
    {
      name : 'vnc_web',
      placeholder : 'Web Interface',
      tooltip : 'Set to enable connecting to the VNC web interface.',
      type: 'checkbox'
    },
  ];
  protected dtype  = 'VNC';
  afterInit() {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_success = [ 'vm', this.pk, 'devices', this.vm ];
    });
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        this.ipAddress = _.find(this.fieldConfig, {'name' : 'vnc_bind'});
        for (const item of res){
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
