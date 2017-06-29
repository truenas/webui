import {Location} from '@angular/common';
import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {
  DynamicFormControlModel,
  DynamicFormService
} from '@ng2-dynamic-forms/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
  selector : 'device-add',
  templateUrl : './device-add.component.html',
  styleUrls : [ './device-add.component.css' ]
})
export class DeviceAddComponent implements OnInit {

  @Input('conf') conf: any;

  public formGroup: FormGroup;
  public error: string;
  public data: Object = {};
  public vm: string;
  public vmid: any;
  protected route_cancel: string[];
  protected route_success: string[];

  @ViewChildren('component') components;

  public busy: Subscription;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected formService: DynamicFormService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState, private location: Location) {}

  ngOnInit() {
    this.formGroup = this.formService.createFormGroup(this.conf.formModel);
    this.conf.afterInit(this);
  }

  goBack() { this.location.back(); }

  onSubmit() {
    this.ws.call('vm.query').subscribe((res) => {
      let formvalue = _.cloneDeep(this.formGroup.value);
      this.route_success = [ 'vm', this.vmid, 'devices', this.vm ];
      this.route_cancel = [ 'vm', this.vmid, 'devices', this.vm ];
      let self = this;
      this.error = null;
      let payload = {};
      let devices = [];
       for (let vm of res) {
        if (vm.name === self.conf.vm) {
          if (self.conf.dtype === 'NIC') {
            devices.push({
              "dtype" : 'NIC',
              "attributes" :
                  {"type" : formvalue.NIC_type, "mac" : formvalue.NIC_mac}
            })
          }
          if (self.conf.dtype === 'VNC') {
            devices.push({
              "dtype" : 'VNC',
              "attributes" : {
                "wait" : formvalue.VNC_wait,
                "vnc_port" : formvalue.VNC_port,
                "vnc_resolution" : formvalue.VNC_resolution
              }
            })
          }
          if (self.conf.dtype === 'DISK') {
            devices.push({
              "dtype" : 'DISK',
              "attributes" :
                  {"type" : formvalue.DISK_mode, "path" : formvalue.DISK_zvol}
            })
          }
          if (self.conf.dtype === 'CDROM') {
            devices.push({
              "dtype" : 'CDROM',
              "attributes" : {"path" : formvalue.CDROM_path}
            })
          }
        }
      }
      payload['devices'] = devices;
      this.busy =
          this.ws.call('vm.create_device', [ self.conf.pk, payload ])
              .subscribe(
                  (res) => {
                    this.router.navigate(
                        new Array('/pages').concat(self.conf.route_success));
                  },
                  (res) => { new EntityUtils().handleError(this, res); });
    });
  }
}
