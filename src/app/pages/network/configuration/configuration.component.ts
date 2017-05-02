import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';
import { EntityConfigComponent } from '../../common/entity/entity-config/';



@Component({
  selector: 'app-networkconfiguration',
  template: `
  <entity-config [conf]="this"></entity-config>
  `
})
export class ConfigurationComponent {

  protected resource_name: string = 'network/globalconfiguration/';
  private entityEdit: EntityConfigComponent;
  private sendEmailBusy: Subscription;
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'gc_hostname',
      label: 'Hostname',
    }),
    new DynamicInputModel({
      id: 'gc_domain',
      label: 'Domain',
    }),
    new DynamicInputModel({
      id: 'gc_ipv4gateway',
      label: 'IPv4 Default Gateway',
    }),
    new DynamicInputModel({
      id: 'gc_ipv6gateway',
      label: 'IPv6 Default Gateway',
    }),
    new DynamicInputModel({
      id: 'gc_nameserver1',
      label: 'Nameserver 1',
    }),
    new DynamicInputModel({
      id: 'gc_nameserver2',
      label: 'Nameserver 2',
    }),
    new DynamicInputModel({
      id: 'gc_nameserver3',
      label: 'Nameserver 3',
    }),
    new DynamicInputModel({
      id: 'gc_httpproxy',
      label: 'HTTP Proxy',
    }),
    new DynamicCheckboxModel({
      id: 'gc_netwait_enabled',
      label: 'Enable netwait feature',
    }),
    new DynamicInputModel({
      id: 'gc_netwait_ip',
      label: 'Netwait IP list',
    }),
    new DynamicTextAreaModel({
      id: 'gc_hosts',
      label: 'Host name data base',
    }),
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}
