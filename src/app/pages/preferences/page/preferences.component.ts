import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef, OnChanges } from '@angular/core';
import { NgModel }   from '@angular/forms';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import {RestService, WebSocketService} from '../../../services/';
import { ThemeService, Theme} from 'app/services/theme/theme.service';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'ui-preferences',
  templateUrl : './preferences.component.html',
  styleUrls: ['./preferences.component.css'],
})
export class PreferencesPage implements OnInit, OnChanges {

  public customThemeForm: Subject<CoreEvent> = new Subject();// formerly known as target
  public loadValuesForm: Subject<CoreEvent> = new Subject();// formerly known as target
  private _baseTheme:any; //= this.themeService.activeTheme;
  public baseThemes: Theme[];
  //@Input() isNew: boolean = false; //change this back to false
  
  //protected queryCall = 'user.query';
  //public args = [["username","=","root"]];
  //protected addCall = 'user.update';

  customThemeFormConfig:FormConfig = {};// see if we can use this instead of passing this whole component in 
  protected isEntity: boolean = true; // was true

  // EXAMPLE THEME
  public values:Theme = {
    name:'',
    description:'',
    label:'',
    labelSwatch:'',
    hasDarkLogo:true,
    accentColors:['violet','blue','magenta', 'cyan', 'red','green', 'orange', 'yellow'],
    favorite:false,
    primary:"",
    accent:"",
    bg1:'',
    bg2:'',
    fg1:'',
    fg2:'',
    'alt-bg1':'',
    'alt-bg2':'',
    'alt-fg1':'',
    'alt-fg2':'',
    yellow:'',
    orange:'',
    red:'',
    magenta:'',
    violet:'',
    blue:'',
    cyan:'',
    green:''
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
        { 
          type: 'select', 
          name: 'labelSwatch', 
          width:'100%',
          placeholder: 'Menu Swatch', 
          options:this.colorOptions,
          tooltip: "Choose which color from the palette will be used for the label swatch that appears left of the label in the menu.",
          class:'inline'
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
          tooltip: "Choose which color from the palette will be the theme's primary color",
          class:'inline'
        },
        { 
          type: 'select', 
          name: 'accent', 
          width:'100%',
          placeholder: 'Choose Accent', 
          options:this.colorOptions,
          tooltip: "Choose which color from the palette will be the theme's accent color",
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

    get baseTheme(){
      return this._baseTheme;
    }

    set baseTheme(name:string){
      this._baseTheme = name;
      this.loadValues(name);
      let theme = this.themeService.findTheme(name);
      this.updatePreview(theme);
    }

    constructor(
      protected router: Router, 
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector, 
      protected _appRef: ApplicationRef,
      public themeService:ThemeService
    ) {}

    ngOnInit(){
      this.init();
    }

    ngOnChanges(changes){
      if(changes.baseTheme){
        alert("baseTheme Changed!")
      }
    }

    init(){
      this.baseTheme = this.themeService.activeTheme;
      this.baseThemes = this.themeService.freenasThemes;
      this.setupColorOptions(this.colors);
      this.loadValues();
      this.customThemeForm.subscribe((evt:CoreEvent) => {
        switch(evt.name){
          case "FormSubmitted":
            console.log("Form Submitted");
            console.log(evt.data);
            this.updatePreview(evt.data);
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

    loadValues(themeName?:string){
      console.log(themeName);
      console.log(this.baseTheme);
      let values = Object.assign({},this.values);
      let theme:Theme;
      if(!themeName){
        theme = this.themeService.currentTheme();
      } else {
        theme = this.themeService.findTheme(themeName);
      }
      console.log(theme);
      let ct = Object.assign({},theme);
      let palette = Object.keys(ct);
      palette.splice(0,7);

      palette.forEach(function(color){
        values[color] = ct[color];
      });

      this.values = values;
      console.log(this.values);
      
    }

    updatePreview(theme:Theme){
            let palette = Object.keys(theme);
            palette.splice(0,7);

            palette.forEach(function(color){
              let swatch = theme[color];
              console.log("Setting " + color + " to " + theme[color]);
              //(<any>document).documentElement.style.setProperty("--" + color, evt.data[color]);
              (<any>document).querySelector('#theme-preview').style.setProperty("--" + color, theme[color]);
            });
              /*(<any>document).documentElement.style.setProperty("--primary",evt.data["primary"]);
              (<any>document).documentElement.style.setProperty("--accent",evt.data["accent"]);*/
    }

    generateFieldConfig(){
      for(let i in this.fieldSets){
        for(let ii in this.fieldSets[i].config){
          this.fieldConfig.push(this.fieldSets[i].config[ii]);
        }
      }
    }

}
