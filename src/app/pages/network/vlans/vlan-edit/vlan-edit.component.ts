import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, NetworkService } from '../../../../services/';

@Component({
  selector: 'app-vlan-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class VlanEditComponent {

  protected resource_name: string = 'network/vlan/';
  protected route_success: string[] = ['network', 'vlans'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'vlan_vint',
      label: 'Virtual Interface',
      disabled: true
    }),
    new DynamicSelectModel({
      id: 'vlan_pint',
      label: 'Parent Interface',
    }),
    new DynamicInputModel({
      id: 'vlan_tag',
      label: 'Vlan Tag',
    }),
    new DynamicInputModel({
      id: 'vlan_description',
      label: 'Description',
    }),
  ];

  private vlan_pint: DynamicSelectModel<string>;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected networkService: NetworkService, protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
    this.networkService.getVlanNicChoices().subscribe((res) => {
      this.vlan_pint = <DynamicSelectModel<string>>this.formService.findById("vlan_pint", this.formModel);
      res.forEach((item) => {
        this.vlan_pint.add({ label: item[1], value: item[0] });
      });
    });
  }

}
