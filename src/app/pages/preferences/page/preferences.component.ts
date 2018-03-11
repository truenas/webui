import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, AfterViewInit, ViewContainerRef } from '@angular/core';
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
      <entity-form-embedded [args]="args" [conf]="this"></entity-form-embedded>
    </mat-card-content>
  </mat-card>
    `
})
export class PreferencesPage implements AfterViewInit{

  //@Input() machineId: string = '';
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  @Input() isNew: boolean = false; //change this back to false

  //protected resource_name: string = 'account/users/';
  protected queryCall = 'user.query';
  public args = [["username","=","root"]];
  protected addCall = 'user.update';
  protected isEntity: boolean = true; // was true

  // CONTROLS
  private name:string;
  private description:string;
  private favorite:boolean;

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
        /*{ 
         type: 'colorpicker', 
         name: 'bg1', 
         placeholder: 'Background 1',
         value:"#333333",
         tooltip: 'Pick a color, any color!',
         class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'bg2', 
          placeholder: 'Background 2',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg1', 
          placeholder: 'Foreground 1',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg2', 
          placeholder: 'Foreground 2',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg1', 
          placeholder: 'Alternate Background 1',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg2', 
          placeholder: 'Alternate Background 2',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg1', 
          placeholder: 'Alternate Foreground 1',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg2', 
          placeholder: 'Alternate Foreground 2',
          value:'#666666',
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
          type: 'colorpicker', 
          name: 'yellow', 
          placeholder: 'Yellow',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'orange', 
          placeholder: 'Orange',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'red', 
          placeholder: 'Red',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'magenta', 
          placeholder: 'Magenta',
          value: '#333333',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'violet', 
          placeholder: 'Violet',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'blue', 
          placeholder: 'Blue',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'cyan', 
          placeholder: 'Cyan',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'green', 
          placeholder: 'Green',
          value:"#333333",
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },*/
      ]
    }
  ];

    constructor(protected router: Router, protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector, protected _appRef: ApplicationRef,
    ) {}

    ngAfterViewInit(){
      this.generateFieldConfig();
    }

    afterInit(entityForm: any) {
      /*entityForm.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
       this.bootloader =_.find(this.fieldConfig, {name : 'bootloader'});
       for (let item of res){
         this.bootloader.options.push({label : item[1], value : item[0]})
       }
      });*/

      //console.warn(entityForm.formGroup.controls);
    }

    generateFieldConfig(){
      for(let i in this.fieldSets){
        for(let ii in this.fieldSets[i].config){
          this.fieldConfig.push(this.fieldSets[i].config[ii]);
        }
      }
    }

    goBack(){
      //let result: {flipState: boolean;} = {flipState: false}
      //this.cancel.emit(result); // <-- bool = isFlipped State
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
