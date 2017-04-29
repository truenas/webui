import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-vm-device-edit',
  // template: `<entity-edit [conf]="this"></entity-edit>`
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

  public formModel: DynamicFormControlModel[] = [];

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
          id: 'path',
          label: 'CDROM Path',
          }),
        ];
    } else if (this.dtype === "NIC"){
      this.formModel = [
        new DynamicSelectModel({
          id: 'type',
          label: 'Network Interface',
          }),
        ];
    } else if (this.dtype === "VNC"){
      this.formModel = [
        new DynamicInputModel({
          id: 'port',
          label: 'port',
          inputType: 'number',
          min: '81',
          max: ' 65535'
          }),
       new DynamicCheckboxModel({
          id: 'wait_on_boot',
          label: 'wait on boot',
          }),
       ];
    } else if (this.dtype === "DISK"){
      this.formModel = [
        new DynamicInputModel({
          id: 'zvol',
          label: 'ZVol',
          }),
        new DynamicSelectModel({
          id: 'mode',
          label: 'Mode',
        }),
      ];
    }
    
    // this.formGroup = this.formService.createFormGroup(this.formModel);
   
      this.rest.get(this.resource_name + '/' + this.pk + '/', {}).subscribe((res) => {
        this.data = res.data.attributes;
        for(let i in this.data) {
          let fg = this.formGroup.controls[i];
          if(fg) {
            fg.setValue(this.data[i]);
          }
        }
      });
  }

  /*customForm(data, formGroup){
    for(let i in data.attributes) {
      let placeholder = this.formService.findById(i, this.formModel) as DynamicInputModel;
      placeholder.valueUpdates.next(data.attributes[i]);
    }
    return formGroup = this.formService.createFormGroup(this.formModel);
  }*/

}
