import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-device-nic-add',
  template: `<device-add [conf]="this"></device-add>`
})
export class DeviceNicAddComponent {

  protected resource_name: string = 'vm/device';
  protected pk: any;
  protected route_success: string[];
  public vm: string;
  private nicType: DynamicSelectModel<string>;

  protected dtype: string = 'NIC';

  public formModel: DynamicFormControlModel[] = [
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


  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
    this.route.params.subscribe(params => {
        this.pk = params['pk'];
        this.vm = params['name'];
        this.route_success = ['vm', this.pk, 'devices', this.vm];
    });
    entityAdd.ws.call('notifier.choices', ['VM_NICTYPES']).subscribe((res) => {
      this.nicType = <DynamicSelectModel<string>>this.formService.findById("type", this.formModel);
      res.forEach((item) => {
        this.nicType.add({ label: item[1], value: item[0] });
      });
    });
  }


}
