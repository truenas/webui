import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';
import { EntityFormComponent } from '../../common/entity/entity-form';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector: 'app-networkconfiguration',
  template: `
  <entity-form [conf]="this"></entity-form>
  `
})
export class ConfigurationComponent {

  protected resource_name: string = 'network/globalconfiguration/';
  private entityEdit: EntityFormComponent;
  private sendEmailBusy: Subscription;
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'gc_hostname',
      placeholder: 'Hostname',
    },
    {
      type: 'input',
      name: 'gc_domain',
      placeholder: 'Domain',
    },
    {
      type: 'input',
      name: 'gc_ipv4gateway',
      placeholder: 'IPv4 Default Gateway',
    },
    {
      type: 'input',
      name: 'gc_ipv6gateway',
      placeholder: 'IPv6 Default Gateway',
    },
    {
      type: 'input',
      name: 'gc_nameserver1',
      placeholder: 'Nameserver 1',
    },
    {
      type: 'input',
      name: 'gc_nameserver2',
      placeholder: 'Nameserver 2',
    },
    {
      type: 'input',
      name: 'gc_nameserver3',
      placeholder: 'Nameserver 3',
    },
    {
      type: 'input',
      name: 'gc_httpproxy',
      placeholder: 'HTTP Proxy',
    },
    {
      type: 'checkbox',
      name: 'gc_netwait_enabled',
      placeholder: 'Enable netwait feature',
    },
    {
      type: 'input',
      name: 'gc_netwait_ip',
      placeholder: 'Netwait IP list',
    },
    {
      type: 'textarea',
      name: 'gc_hosts',
      placeholder: 'Host name data base',
    },
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}
