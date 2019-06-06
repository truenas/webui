import {ApplicationRef, Component, Injector} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

import helptext from './../../../helptext/vm/vm-wizard/vm-wizard';
import {RestService, WebSocketService} from '../../../services/';

@Component({
  selector : 'app-vm',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VmFormComponent {

  protected resource_name = 'vm/vm';
  protected isEntity = true;
  protected route_success: string[] = [ 'vm' ];
  protected entityForm: any;
  protected save_button_enabled: boolean;

  public fieldConfig: FieldConfig[] = [
    { type: 'input', name: 'name', placeholder: 'Name'},
    { type: 'input', name : 'description', placeholder : 'Description'},
    {
      name: 'time',
      placeholder: helptext.time_placeholder,
      type: 'select',
      options: [{ label: helptext.time_local_text, value: 'LOCAL'}, { label: 'UTC', value: 'UTC' }]
    },
    { type : 'input', name: 'vcpus'  ,placeholder : 'Virtual CPUs'},
    { type: 'input', name : 'memory', placeholder : 'Memory Size (MiB)'},
    { type: 'select', name : 'bootloader', placeholder : 'Boot Loader Type', options: []},
    { type: 'checkbox', name : 'autostart', placeholder : 'Start on Boot'}

  ];
  private bootloader: any;
  public bootloader_type: any[];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityForm: any) {
    entityForm.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
          this.bootloader =_.find(this.fieldConfig, {name : 'bootloader'});
          for (let item of res){
            this.bootloader.options.push({label : item[1], value : item[0]})
          }
        });
  }
}
