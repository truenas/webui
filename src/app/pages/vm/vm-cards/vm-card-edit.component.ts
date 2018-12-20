import { ApplicationRef, Input, Component, Injector, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { RestService, WebSocketService } from '../../../services/';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import helptext from '../../../helptext/vm/vm-cards/vm-cards';

@Component({
  selector : 'vm-card-edit',
  template : `<entity-form-embedded [data]="values" [target]="target" [conf]="this"></entity-form-embedded>`
})
export class VmCardEditComponent implements OnChanges {

  @Input() machineId: string = '';
  @Input() values: any;
  @Input() isNew: boolean = false;
  @Input() target: Subject<CoreEvent>;
  @Input() conf: any;

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
            placeholder: helptext.config_name_placeholder,
            tooltip: helptext.config_name_tooltip,
            required: true,
            validation:helptext.config_name_validation
          },
          { type: 'input',
            name : 'description',
            width:'100%',
            placeholder : helptext.config_description_placeholder,
            tooltip: helptext.config_description_tooltip,
            validation: helptext.config_description_validation,
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
            placeholder: helptext.autostart_placeholder,
            tooltip: helptext.autostart_tooltip,
            class:'inline'},
          {
            type: 'select',
            name: 'bootloader',
            width:'50%',
            placeholder: helptext.bootloader_placeholder,
            tooltip: helptext.bootloader_tooltip,
            options: [] , class:'inline',
            required: true,
            validation:helptext.bootloader_validation}
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
            placeholder : helptext.vcpus_placeholder,
            tooltip: helptext.vcpus_tooltip,
            class:'inline',
            required: true,
            validation:helptext.vcpus_validation},
          {
            type: 'input',
            name: 'memory',
            width:'60%',
            placeholder: helptext.memory_placeholder,
            tooltip: helptext.memory_tooltip,
            class:'inline',
            required: true,
            validation:helptext.memory_validation
          }
        ]
      }
    ];
    private bootloader: any;
  public bootloader_type: any[];
  public custActions: Array<any> = [
    {
      id: 'Clone',
      name: 'Clone',
      eventName:"CloneVM"
    },
    {
      id:'cancel',
      name:'Cancel',
      eventName: "FormCancelled"
    }
  ]

  constructor(private core: CoreService ,protected router: Router, protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
  ) {}

  ngOnInit(){
    this.generateFieldConfig();
  }

  ngOnChanges(changes){
  }

  afterInit(entityForm: any) {
    this.bootloader =_.find(this.fieldConfig, {name : 'bootloader'});
    if( entityForm.data.bootloader === "GRUB") {
      this.bootloader.options.push({label : 'GRUB', value : 'GRUB'});
    } else { 
      entityForm.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
        for (let item of res){
          this.bootloader.options.push({label : item[1], value : item[0]})
        }
      });
    }
  }

  generateFieldConfig(){
    for(let i in this.fieldSets){
      for(let ii in this.fieldSets[i].config){
        this.fieldConfig.push(this.fieldSets[i].config[ii]);
      }
    }
  }

}
