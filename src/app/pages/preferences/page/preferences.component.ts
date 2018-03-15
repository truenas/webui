import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import {RestService, WebSocketService} from '../../../services/';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';

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
export class PreferencesPage implements OnInit {

  public target: Subject<CoreEvent> = new Subject();
  //@Input() isNew: boolean = false; //change this back to false
  
  //protected queryCall = 'user.query';
  //public args = [["username","=","root"]];
  //protected addCall = 'user.update';
  protected isEntity: boolean = true; // was true

  // EXAMPLE THEME
  public values:any = {
    name:'dracula',
    description:'Dracula color theme',
    hasDarkLogo:true,
    accentColors:['violet','blue','magenta', 'cyan', 'red','green', 'orange', 'yellow'],
    favorite:false,
    primary:"var(--blue)",
    accent:"var(--violet)",
    bg1:'#181a26',
    bg2:'#282a36',
    fg1:'#f8f8f2',
    fg2:'#fafaf5',
    'alt-bg1':'#f8f8f2',
    'alt-bg2':'#fafaf5',
    'alt-fg1':'#181a26',
    'alt-fg2':'#282a36',
    yellow:'#f1fa8c',
    orange:'#ffb86c',
    red:'#ff5555',
    magenta:'#ff79c6',
    violet:'#bd93f9',
    blue:'#6272a4',
    cyan:'#8be9fd',
    green:'#50fa7b'
  }

  // CONTROLS
  /*public values:any = {
    name:'Custom',
    description:'Custom User Theme',
    favorite:false,
    primary:"var(--cyan)",
    accent:"var(--violet)",
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
  }*/
  private colors: string[] = ['bg1','bg2','fg1','fg2','alt-bg1','alt-bg2','alt-fg1','alt-fg2','yellow','orange','red','magenta','violet','blue','cyan','green'];
  // Had to hard code colorVars because concatenated strings get sanitized
  private colorVars: string[] = [
  'var(--bg1)',
  'var(--bg2)',
  'var(--fg1)',
  'var(--fg2)',
  'var(--alt-bg1)',
  'var(--alt-bg2)',
  'var(--alt-fg1)',
  'var(--alt-fg2)',
  'var(--yellow)',
  'var(--orange)',
  'var(--red)',
  'var(--magenta)',
  'var(--violet)',
  'var(--blue)',
  'var(--cyan)',
  'var(--green)'
  ];
  private colorOptions: any[] = [];
  private colorWidth:string = "180px";
  public fieldConfig:FieldConfig[] = [];

  public fieldSetDisplay:string = 'no-margins';//default | carousel | stepper
  public fieldSets: FieldSet[] = [
    {
      name:'General',
      class:'general',
      width:'300px',
      config:[
        { 
          type: 'input', 
          name: 'name', 
          width:'100%',
          placeholder: 'Custom Theme Name',
          tooltip: 'Enter a name to identify your new theme.',
        },
        { 
          type: 'input', 
          name: 'label', 
          width:'100%',
          placeholder: 'Menu Label',
          tooltip: 'Specify how the theme name should appear in the menu.',
        },
        { type: 'input', 
          name : 'description', 
          width:'100%',
          placeholder : 'Description',
          tooltip: 'Enter a short description of your theme.',
        },
        { 
          type: 'checkbox', 
          name: 'favorite', 
          width:'100%',
          placeholder: 'Add to Favorites', 
          tooltip: 'When checked, this theme will be added to your favorites list. Favorites are always available on the top navigation bar.',
          class:'inline'
        },
        { 
          type: 'checkbox', 
          name: 'hasDarkLogo', 
          width:'100%',
          placeholder: 'Choose Logo Type', 
          /*options:[
            {label:"Dark", value: true},
            {label:"Regular", value:false}
          ],*/
          tooltip: "Choose the logo type",
          class:'inline'
        },
        { 
          type: 'select', 
          name: 'primary', 
          width:'100%',
          placeholder: 'Choose Primary', 
          options:this.colorOptions,
          tooltip: "Choose which color will be the theme's primary color",
          class:'inline'
        },
        { 
          type: 'select', 
          name: 'accent', 
          width:'100%',
          placeholder: 'Choose Accent', 
          options:this.colorOptions,
          tooltip: "Choose which color will be the theme's accent color",
          class:'inline'
        },
      ]
    },
    {
      name:'Theme Colors',
      class:'color-palette',
      width:'calc(100% - 300px)',
      config:[
        { 
         type: 'colorpicker', 
         name: 'bg1', 
         width: this.colorWidth,
         placeholder: 'Background 1',
         tooltip: 'Pick a color, any color!',
         class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'bg2', 
          width: this.colorWidth,
          placeholder: 'Background 2',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg1', 
          width: this.colorWidth,
          placeholder: 'Foreground 1',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg2', 
          width: this.colorWidth,
          placeholder: 'Foreground 2',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg1', 
          width: this.colorWidth,
          placeholder: 'Alt Background 1',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg2', 
          width: this.colorWidth,
          placeholder: 'Alt Background 2',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg1', 
          width: this.colorWidth,
          placeholder: 'Alt Foreground 1',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg2', 
          width: this.colorWidth,
          placeholder: 'Alt Foreground 2',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
      /*]
    },
    {
      name:'Theme Colors 9-16',
      class:'accent-colors',
      width:'calc(50% - 300px)',
      config:[*/
        { 
          type: 'colorpicker', 
          name: 'yellow', 
          width: this.colorWidth,
          placeholder: 'Yellow',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'orange', 
          width: this.colorWidth,
          placeholder: 'Orange',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'red', 
          width: this.colorWidth,
          placeholder: 'Red',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'magenta', 
          width: this.colorWidth,
          placeholder: 'Magenta',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'violet', 
          width: this.colorWidth,
          placeholder: 'Violet',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'blue', 
          width: this.colorWidth,
          placeholder: 'Blue',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'cyan', 
          width: this.colorWidth,
          placeholder: 'Cyan',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'green', 
          width: this.colorWidth,
          placeholder: 'Green',
          tooltip: 'Pick a color, any color!',
          class:'inline'
        }
      ]
    }
  ]

    constructor(protected router: Router, protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector, protected _appRef: ApplicationRef,
    ) {}

    ngOnInit(){
      this.setupColorOptions(this.colors);
      this.target.subscribe((evt:CoreEvent) => {
        switch(evt.name){
          case "FormSubmitted":
            console.log("Form Submitted");
            console.log(evt.data);
            let palette = Object.keys(evt.data);
            palette.splice(0,6);

            palette.forEach(function(color){
              let swatch = evt.data[color];
              console.log("Setting " + color + " to " + evt.data[color]);
              (<any>document).documentElement.style.setProperty("--" + color, evt.data[color]);
            });
              (<any>document).documentElement.style.setProperty("--primary",evt.data["primary"]);
              (<any>document).documentElement.style.setProperty("--accent",evt.data["accent"]);

          break;
          case "FormCancelled":
            console.log("Form Cancelled");
          break;
        }
      });
      this.generateFieldConfig();
    }

    afterInit(entityForm: any) {
    }
    
    setupColorOptions(palette){
      for(let color in palette){
        this.colorOptions.push({label:this.colors[color], value:this.colorVars[color]});
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
