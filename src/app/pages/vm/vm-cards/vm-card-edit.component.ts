import {ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef
} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';


import {RestService, WebSocketService} from '../../../services/';

@Component({
  selector : 'vm-card-edit',
  template : `<entity-form-embedded [args]="machineId" [conf]="this"></entity-form-embedded>`
})
export class VmCardEditComponent {

  @Input() machineId: string = '';
  @Output() cancel: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() saved: EventEmitter<boolean> = new EventEmitter<boolean>();

  protected resource_name: string = 'vm/vm/' + this.machineId;
  protected isEntity: boolean = true;
  //protected route_success: string[] = [ 'vm' ];

  public fieldConfig: FieldConfig[] = [
    { type: 'input', name: 'name', placeholder: 'Name'},
    { type: 'input', name : 'description', placeholder : 'Description'},
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

  goBack(){
    this.cancel.emit(false); // <-- bool = isFlipped State
  }

  onSuccess(message?:any){
    this.saved.emit(false);
    console.log(message);
  }
}
