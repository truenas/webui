import {ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef
} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import {
  FieldSet
} from '../../common/entity/entity-form/models/fieldset.interface';


import {RestService, WebSocketService} from '../../../services/';

@Component({
  selector : 'vm-card-edit',
  template : `<entity-form-embedded [args]="machineId" [conf]="this"></entity-form-embedded>`
})
export class VmCardEditComponent {

  @Input() machineId: string = '';
  @Output() cancel: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  @Input() isNew: boolean = false;

  protected resource_name: string = 'vm/vm/' + this.machineId;
  protected isEntity: boolean = true;
  protected addCall = 'vm.create';
  //protected route_add: string[] = [ 'vm', 'add' ];

  public fieldConfig:FieldConfig[] = [];

  public fieldSetDisplay:string = 'default';//default | carousel | stepper
  public fieldSets: FieldSet[] = [
    {
      name:'Config',
      class:'config',
      config:[
	{ type: 'input', name: 'name', placeholder: 'Name'},
	{ type: 'input', name : 'description', placeholder : 'Description'}
      ]
    },
    {
      name:'Boot Options',
      class:'boot-options',
      config:[
	{ type: 'checkbox', name : 'autostart', placeholder : 'Start on Boot', class:'inline'},
	{ type: 'select', name : 'bootloader', placeholder : 'Boot Loader Type', options: [] , class:'inline'}
      ]
    },
    {
      name:'Resources',
      class:'resources',
      config:[
	{ type : 'input', name: 'vcpus'  ,placeholder : 'Virtual CPUs',class:'inline'},
	{ type: 'input', name : 'memory', placeholder : 'Memory Size (MiB)', class:'inline'}
      ]
    }
  ];
private bootloader: any;
public bootloader_type: any[];

constructor(protected router: Router, protected rest: RestService,
  protected ws: WebSocketService,
  protected _injector: Injector, protected _appRef: ApplicationRef,
) {}

ngOnInit(){
  this.generateFieldConfig();
}

afterInit(entityForm: any) {
  entityForm.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
    this.bootloader =_.find(this.fieldConfig, {name : 'bootloader'});
    for (let item of res){
      this.bootloader.options.push({label : item[1], value : item[0]})
    }
  });
}

generateFieldConfig(){
  for(let i in this.fieldSets){
    for(let ii in this.fieldSets[i].config){
      this.fieldConfig.push(this.fieldSets[i].config[ii]);
    }
  }
}

goBack(){
  this.cancel.emit(false); // <-- bool = isFlipped State
}

onSuccess(message?:any){

  let result: {flipState:boolean;id?:any} = {flipState:false,id:message};
  if(message.data){
    //console.log(message);
    result.id = message.data.id;
  } else {
    result.id = message;
  }
  if(result.id){
    this.saved.emit(result);
  }

  //console.log(message);
}
}
