import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef, OnChanges } from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import {RestService, WebSocketService} from '../../../services/';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'vm-card-edit',
  template : `<entity-form-embedded [data]="values" [target]="target" [conf]="this"></entity-form-embedded>`
})
export class VmCardEditComponent implements OnChanges {

  @Input() machineId: string = '';
  @Input() values: any;
  @Input() isNew: boolean = false;
  @Input() target: Subject<CoreEvent>;

  protected isEntity: boolean = true;

  public fieldConfig:FieldConfig[] = [];

  public fieldSetDisplay:string = 'default';//default | carousel | stepper
  public fieldSets: FieldSet[] = [
    {
      name:'Config',
      class:'config',
      config:[
        { 
          type: 'input', 
          name: 'name', 
          width:'100%',
          placeholder: 'Name',
          tooltip: 'Enter a name to identify the VM.',
        },
        { type: 'input', 
          name : 'description', 
          width:'100%',
          placeholder : 'Description',
          tooltip: 'Enter a short description of the VM or its purpose.',
        }
      ]
    },
    {
      name:'Boot Options',
      class:'boot-options',
      config:[
        { 
          type: 'checkbox', 
          name: 'autostart', 
          width:'50%',
          placeholder: 'Start on Boot', 
          tooltip: 'When checked, start the VM automatically on boot.',
          class:'inline'},
        { 
          type: 'select', 
          name: 'bootloader',
          width:'50%',
          placeholder: 'Boot Loader Type',
          tooltip: 'Select <b>UEFI</b> for newer operating systems, or <b>UEFI-CSM</b>\
          (Compatibility Support Mode) for older operating systems that only\
          understand BIOS booting.',
          options: [] , class:'inline'}
      ]
    },
    {
      name:'Resources',
      class:'resources',
      config:[
        { 
          type: 'input', 
          name: 'vcpus',
          width:'40%',
          placeholder : 'Virtual CPUs',
          tooltip: 'Select the number of virtual CPUs allocated to the VM.\
          The maximum is 16, although the host CPU might limit the maximum number.\
          The operating system used in the VM might also have operational or licensing\
          restrictions on the number of CPUs allowed.',

          class:'inline'},
        { 
          type: 'input', 
          name: 'memory', 
          width:'60%',
          placeholder: 'Memory Size (MiB)', 
          tooltip: 'Select the megabytes of RAM allocated to the VM.',
          class:'inline'}
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

  ngOnChanges(changes){
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

}
