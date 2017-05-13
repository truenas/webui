import { lookup } from 'dns';
import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/rest.service';
import { EntityUtils } from '../../../common/entity/utils';

import * as _ from 'lodash';

@Component({
  selector: 'app-vm-device-edit',
  templateUrl: './device-edit.component.html'
})
export class DeviceEditComponent implements OnInit{ 

  protected resource_name: string = 'vm/device';
  protected route_delete: string[] ;
  protected route_success: string[] ;
  protected vmid: any;
  protected vm: string;
  protected dtype: string;
  protected formGroup: FormGroup;
  private sub: any;
  public error: string;
  public data: Object = {};
  protected pk: any;
  private busy: Subscription;



  protected formModel: DynamicFormControlModel[] = [];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {

  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.vmid = params['vmid'];
      this.vm = params['name'];
      this.route_success = ['vm', this.vmid, 'devices', this.vm];
      this.route_delete = ['vm', this.vmid, 'devices', this.vm, 'delete'];
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
          min: '81',
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
        new DynamicInputModel({
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
      this.rest.get(this.resource_name + '/' + this.pk + '/', {}).subscribe((res) => {
        function setgetValues(data, lookup_table) {
          for(let i in data) {
            let fg = self.formGroup.controls[lookup_table[i]];
            if(fg) {
              fg.setValue(data[i]);
            }
          }
        }
        var self = this;
        var data = res.data.attributes;
        switch(this.dtype){
          case 'VNC':{
            setgetValues(data, vnc_lookup_table);
          };
          case 'NIC':{
            setgetValues(data, nic_lookup_table);
            };
          case 'CDROM':{
            setgetValues(data, cdrom_lookup_table);
            };
          case 'DISK':{
            setgetValues(data, disk_lookup_table);
          }
        }
      });
    }
  onSubmit() {
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);
    let values = {};
    switch(this.dtype){
      case 'VNC':{
        values['VNC_port'] = value['VNC_port'];
        values['VNC_wait'] = value['VNC_wait'];
        values['VNC_resolution'] = value['VNC_resolution'];
      };
      case 'NIC':{
        values['NIC_type'] = value['NIC_type'];
        values['NIC_mac'] = value['NIC_mac'];
      };
      case 'CDROM':{
        values['CDROM_path'] = value['CDROM_path'];
      }
      case 'DISK':{
        values['DISK_zvol'] = value['DISK_zvol'];
        values['DISK_mode'] = value['DISK_mode'];
      }
    }
    values['dtype'] = this.dtype;
    values['vm'] = this.vmid;
    this.busy = this.rest.put(this.resource_name + '/' + this.pk + '/', {body: JSON.stringify(values),}).subscribe((res) => {
      this.router.navigate(new Array('/pages').concat(this.route_success));
    }, (res) => {
      new EntityUtils().handleError(this, res);
    });
  }
}