import { ApplicationRef, Component, Injector, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService } from '@ng2-dynamic-forms/core';

import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { Location } from '@angular/common';

import { Subscription } from 'rxjs';
import { EntityUtils } from '../../../common/entity/utils';

import * as _ from 'lodash';
@Component({
  selector: 'device-add',
  templateUrl: './device-add.component.html',
  styleUrls: ['./device-add.component.css']
})
export class DeviceAddComponent implements OnInit {

  @Input('conf') conf: any;

  public formGroup: FormGroup;
  public error: string;
  public data: Object = {};
  protected vm: string;
  protected vmid: any;
  protected route_cancel: string[] ;
  protected route_success: string[] ;

  @ViewChildren('component') components;

  private busy: Subscription;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState, private location: Location) {

  }

  ngOnInit() {
    this.formGroup = this.formService.createFormGroup(this.conf.formModel);
    this.conf.afterInit(this);
  }

  goBack() {
    this.location.back();
  }

  onSubmit() {
    this.ws.call('vm.query').subscribe((res) => {
      this.route_success = ['vm', this.vmid, 'devices', this.vm];
      this.route_cancel = ['vm', this.vmid, 'devices', this.vm];
      let self = this;
      this.error = null;
      let payload = {};
      let formvalue = _.cloneDeep(this.formGroup.value);
      for (let vm of res) {
        if (vm.name === self.conf.vm) {
          var devices = []
          for (let device of vm.devices) {
            if (device.dtype === 'NIC'){
              devices.push({"dtype" : 'NIC', "attributes":{"type": formvalue.NIC_type ? formvalue.NIC_type : device.attributes.type ,
              "mac": formvalue.NIC_mac ? formvalue.NIC_mac : device.attributes.mac}})
            }
            if (device.dtype === 'VNC'){
              devices.push({"dtype" : 'VNC', "attributes":{"wait": new EntityUtils().bool(formvalue.VNC_wait ? formvalue.VNC_wait : device.attributes.wait), 
              "vnc_port": formvalue.VNC_port ? formvalue.VNC_port : device.attributes.port, 
              "vnc_resolution":formvalue.VNC_resolution? formvalue.VNC_resolution:device.attributes.vnc_resolution}})
            }
            if (device.dtype === 'DISK'){
              devices.push({"dtype" : 'DISK', "attributes":{
                "type": formvalue.DISK_mode ? formvalue.DISK_mode: device.attributes.type, 
                "path": formvalue.DISK_zvol ? formvalue.DISK_zvol: device.attributes.path}})
            }
            if (device.dtype === 'CDROM'){
              devices.push({"dtype" : 'CDROM', "attributes":{ 
                "path": formvalue.CDROM_path ? formvalue.CDROM_path: device.attributes.path}})
            }
          }
        }
      }
      payload['devices'] = devices;
      this.busy = this.ws.call('vm.update', [self.vmid, payload]).subscribe((res) => {
        this.router.navigate(new Array('/pages').concat(this.route_success));
      }, (res) => {
        new EntityUtils().handleError(this, res);
      });
    });
  }

}
