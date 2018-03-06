import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import {RestService, WebSocketService} from '../../../services/';

@Component({
  selector : 'ui-preferences',
  template : `
    <mat-card>
      <mat-toolbar-row>
        <h4>UI Preferences</h4>
      </mat-toolbar-row>
      <mat-card-content>
        <entity-form-embedded [conf]="this"></entity-form-embedded>
      </mat-card-content>
    </mat-card>
  `
})
export class PreferencesPage {

  @Input() machineId: string = '';
  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  @Input() isNew: boolean = false;

  protected resource_name: string = 'vm/vm/' + this.machineId;
  protected isEntity: boolean = true;
  protected addCall = 'vm.create';

  public fieldConfig:FieldConfig[] = [];

  public fieldSetDisplay:string = 'default';//default | carousel | stepper
    public fieldSets: FieldSet[] = [
      {
        name:'General',
        class:'general',
        config:[
          { 
            type: 'input', 
            name: 'name', 
            placeholder: 'Custom Theme Name',
            tooltip: 'Enter a name to identify your new theme.',
          },
          { type: 'input', 
            name : 'description', 
            placeholder : 'Description',
            tooltip: 'Enter a short description of your theme.',
          },
          { 
            type: 'checkbox', 
            name: 'favorite', 
            placeholder: 'Add to Favorites', 
            tooltip: 'When checked, this theme will be added to your favorites list. Favorites are always available on the top navigation bar.',
            class:'inline'
          }
        ]
      },
      {
        name:'Background and Foreground Colors',
        class:'bg-fg-colors',
        config:[
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Background 1',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Background 2',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Foreground 1',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Foreground 2',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Alternate Background 1',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Alternate Background 2',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Alternate Foreground 1',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Alternate Foreground 2',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
        ]
      },
      {
        name:'Theme Colors 9-16',
        class:'accent-colors',
        config:[
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Yellow',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Orange',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Red',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Magenta',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Violet',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Blue',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Cyan',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
          { 
            type: 'input', 
            name: 'color', 
            placeholder: 'Green',
            tooltip: 'Pick a color, any color!',
            class:'inline'
          },
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
    let result: {flipState: boolean;} = {flipState: false}
      this.cancel.emit(result); // <-- bool = isFlipped State
  }

  onSuccess(message?:any){
    alert("This is a test: Theme submitted");
    /*
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
    */
    //console.log(message);
    }
}
