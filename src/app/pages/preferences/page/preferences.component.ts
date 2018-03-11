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
      <entity-form-embedded [args]="args" [conf]="this"></entity-form-embedded>
    </mat-card-content>
  </mat-card>
    `
})
export class PreferencesPage implements OnInit {

  //@Input() machineId: string = '';
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  @Input() isNew: boolean = false; //change this back to false
  //@Input() values: any;

  //protected resource_name: string = 'account/users/';
  protected queryCall = 'user.query';
  public args = [["username","=","root"]];
  protected addCall = 'user.update';
  protected isEntity: boolean = true; // was true

  // CONTROLS
  public values:any = {
    name:'Custom',
    description:'Custom User Theme',
    favorite:false,
    bg1:'#333333',
    bg2:'#555555',
    fg1:'#666666',
    fg2:'#888888',
    'alt-bg1':'#666666',
    'alt-bg2':'#999999',
    'alt-fg1':'#333333',
    'alt-fg2':'#555555',
    yellow:'#b58900',
    orange:'#cb4b16',
    red:'#dc322f',
    magenta:'#d33682',
    violet:'#6c71c4',
    blue:'#268bd2',
    cyan:'#2aa198',
    green:'#859900'
  }

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
         type: 'colorpicker', 
         name: 'bg1', 
         placeholder: 'Background 1',
         tooltip: 'Pick a color, any color!',
         class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'bg2', 
          placeholder: 'Background 2',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg1', 
          placeholder: 'Foreground 1',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg2', 
          placeholder: 'Foreground 2',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg1', 
          placeholder: 'Alternate Background 1',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg2', 
          placeholder: 'Alternate Background 2',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg1', 
          placeholder: 'Alternate Foreground 1',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg2', 
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
          type: 'colorpicker', 
          name: 'yellow', 
          placeholder: 'Yellow',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'orange', 
          placeholder: 'Orange',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'red', 
          placeholder: 'Red',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'magenta', 
          placeholder: 'Magenta',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'violet', 
          placeholder: 'Violet',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'blue', 
          placeholder: 'Blue',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'cyan', 
          placeholder: 'Cyan',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'green', 
          placeholder: 'Green',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
      ]
    }
  ];

    constructor(protected router: Router, protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector, protected _appRef: ApplicationRef,
    ) {}

    ngOnInit(){
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
