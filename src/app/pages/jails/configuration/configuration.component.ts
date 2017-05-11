import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';

@Component({
  selector: 'app-jail-configuration',
  template: `
  <entity-config [conf]="this"></entity-config>
  `
})
export class JailsConfigurationComponent {

  protected resource_name: string = 'jails/configuration/';
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'jc_path',
      label: 'Jail Root',
    }),
    new DynamicCheckboxModel({
      id: 'jc_ipv4_dhcp',
      label: 'IPv4 DHCP',
    }),
    new DynamicCheckboxModel({
      id: 'jc_ipv6_autoconf',
      label: 'IPv6 Autoconfigure',
    }),
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityEdit: any) {
  }

}
