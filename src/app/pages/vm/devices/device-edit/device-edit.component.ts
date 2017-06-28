import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { WebSocketService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { VmService } from '../../../../services/vm.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-vm-device-edit',
  templateUrl: './device-edit.component.html',
  providers: [VmService]
})



export class DeviceEditComponent implements OnInit{ 

  public resource_name: string = 'vm/device';
  public volume_resource_name: string = 'storage/volume'
  public route_cancel: string[] ;
  public route_success: string[] ;
  public vmid: any;
  public vm: string;
  public dtype: string;
  public formGroup: FormGroup;
  public sub: any;
  public error: string;
  public data: Object = {};
  public pk: any;
  public busy: Subscription;
  public DISK_zvol: DynamicSelectModel<string>;
  public formModel: DynamicFormControlModel[] = [];

  constructor(protected router: Router, protected route: ActivatedRoute,protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef , public vmService: VmService) {

  }
  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.vmid = params['vmid'];
      this.vm = params['name'];
      this.route_success = ['vm', this.vmid, 'devices', this.vm];
      this.route_cancel = ['vm', this.vmid, 'devices', this.vm];
      this.dtype = params['dtype'];
      this.pk = params['pk'];
    });
    if (this.dtype === "CDROM"){
      this.formModel = [
        new DynamicInputModel({
          id: 'CDROM_path',
          label: 'CDROM Path',
          }),
        ];
    } else if (this.dtype === "NIC"){
      this.formModel = [
        new DynamicSelectModel({
          id: 'NIC_type',
          label: 'Adapter Type:',
          options: [
            { label: 'Intel e82545 (e1000)', value: "E1000" },
            { label: 'VirtIO', value: "VIRTIO" },
            ],
          }),
        new DynamicInputModel({
          id: 'NIC_mac',
          label: 'Mac Address',
          value: '00:a0:98:FF:FF:FF',
          }),
        ];
    } else if (this.dtype === "VNC"){
      this.formModel = [
        new DynamicInputModel({
          id: 'VNC_port',
          label: 'port',
          inputType: 'number',
          min: '0',
          max: ' 65535'
          }),
       new DynamicCheckboxModel({
          id: 'VNC_wait',
          label: 'wait on boot',
        }),
      new DynamicSelectModel({
          id: 'VNC_resolution',
          label: 'Resolution:',
          options: [
            { label: '1920x1080', value: "1920x1080" },
            { label: '1400x1050', value: "1400x1050" },
            { label: '1280x1024', value: "1280x1024" },
            { label: '1280x960', value: "1280x960" },
            { label:'1024x768', value:'1024x768' },
            { label:'800x600', value: '800x600'},
            { label: '640x480', value:'640x480'},
            ],
          }),
       ];
    } else if (this.dtype === "DISK"){
      this.formModel = [
        new DynamicSelectModel({
          id: 'DISK_zvol',
          label: 'ZVol',
          }),
        new DynamicSelectModel({
          id: 'DISK_mode',
          label: 'Mode',
          options: [
            { label:'AHCI', value: 'AHCI'},
            { label: 'VirtIO',  value: 'VIRTIO'},
          ],
        }),
      ];
      this.vmService.getStorageVolumes().subscribe((res) => {
        let data = new EntityUtils().flattenData(res.data);
        this.DISK_zvol = <DynamicSelectModel<string>>this.formService.findById("DISK_zvol", this.formModel);;
        for (let dataset of data){
          if (dataset.type === 'zvol') {
            this.DISK_zvol.add({ label: dataset.name, value: dataset.path });
          };
        };
      });
    }

    this.formGroup = this.formService.createFormGroup(this.formModel);
      let vnc_lookup_table: Object = {
        'vnc_port':'VNC_port',
        'vnc_resolution': 'VNC_resolution',
        'wait': 'VNC_wait',
      };
      let nic_lookup_table: Object = {
        'mac': 'NIC_mac',
        'type': 'NIC_type',
      };
      let disk_lookup_table: Object = {
        'path': "DISK_zvol",
        'type': "DISK_mode",
      };
      let cdrom_lookup_table: Object = {
        'path': "CDROM_path",
      };

    this.ws.call('vm.query').subscribe((res) => {
      function setgetValues(data, lookupTable) {
        for(let i in data) {
          let fg = self.formGroup.controls[lookupTable[i]];
          if(fg) {
            fg.setValue(data[i]);
          }
        }
      }
      let self = this;
      for (let vm of res) {
        if (vm.name === this.vm) {
          for (let device of vm.devices) {
            switch(device.dtype){
              case 'VNC':{
                setgetValues(device.attributes, vnc_lookup_table);
                break;
              };
              case 'NIC':{
                setgetValues(device.attributes, nic_lookup_table);
                break;
              };
              case 'CDROM':{
                setgetValues(device.attributes, cdrom_lookup_table);
                break;
              };
              case 'DISK':{
                setgetValues(device.attributes, disk_lookup_table);
                break;
              };
          }
        }
        };
      }
    });
    }
  goBack() {
      let route = this.route_cancel;
    if(!route) {
      route = this.route_success;
    }
    this.router.navigate(new Array('/pages').concat(route));
  }

  onSubmit() {
    this.ws.call('vm.query').subscribe((res) => {
      let self = this;
      this.error = null;
      let payload = {};
      let devices = []
      let formvalue = _.cloneDeep(this.formGroup.value);
      for (let vm of res) {
        if (vm.name === this.vm) {
          for (let device of vm.devices) {
            if (device.dtype === 'NIC'){
              devices.push({'dtype' : 'NIC', 'attributes': {
                'type': formvalue.NIC_type ? formvalue.NIC_type : device.attributes.type,
                'mac': formvalue.NIC_mac ? formvalue.NIC_mac : device.attributes.mac}})}
            if (device.dtype === 'VNC'){
              devices.push({'dtype' : 'VNC', 'attributes': {
                'wait': new EntityUtils().bool(formvalue.VNC_wait ? formvalue.VNC_wait : device.attributes.wait),
                'vnc_port': formvalue.VNC_port ? formvalue.VNC_port : device.attributes.port,
                'vnc_resolution': formvalue.VNC_resolution ?
                formvalue.VNC_resolution : device.attributes.vnc_resolution}})
            }
            if (device.dtype === 'DISK'){
              devices.push({'dtype' : 'DISK', 'attributes': {
                'type': formvalue.DISK_mode ? formvalue.DISK_mode : device.attributes.type,
                'path': formvalue.DISK_zvol ? formvalue.DISK_zvol : device.attributes.path}})
            }
            if (device.dtype === 'CDROM'){
              devices.push({'dtype' : 'CDROM', 'attributes': {
                'path': formvalue.CDROM_path ? formvalue.CDROM_path: device.attributes.path}})
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