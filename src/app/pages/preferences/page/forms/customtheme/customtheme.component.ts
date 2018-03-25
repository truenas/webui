import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef, OnChanges } from '@angular/core';
import { NgModel }   from '@angular/forms';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import {RestService, WebSocketService} from 'app/services/';
import { ThemeService, Theme} from 'app/services/theme/theme.service';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { DialogService } from 'app/services/dialog.service';
import { T } from 'app/translate-marker';

@Component({
  selector : 'custom-theme',
  templateUrl : './customtheme.component.html',
  styleUrls: ['./customtheme.component.css'],
})
export class CustomThemeComponent implements OnInit, OnChanges {

  public customThemeForm: Subject<CoreEvent> = new Subject();// formerly known as target
  public loadValuesForm: Subject<CoreEvent> = new Subject();// formerly known as target
  private _baseTheme:any; //= this.themeService.activeTheme;
  private _globalPreview:boolean = false;
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
      label: true,
      class:'general',
      width:'300px',
      config:[
        { 
          type: 'input', 
          name: 'name', 
          width:'100%',
          placeholder: 'Custom Theme Name',
          required:true,
          tooltip: 'Enter a name to identify your new theme.',
        },
        { 
          type: 'input', 
          name: 'label', 
          width:'100%',
          placeholder: 'Menu Label',
          required:true,
          tooltip: 'Specify how the theme name should appear in the menu.',
        },
        { 
          type: 'select', 
          name: 'labelSwatch', 
          width:'100%',
          placeholder: 'Menu Swatch', 
          required:true,
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
          required:true,
          options:this.colorOptions,
          tooltip: "Choose which color from the palette will be the theme's primary color",
          class:'inline'
        },
        { 
          type: 'select', 
          name: 'accent', 
          width:'100%',
          placeholder: 'Choose Accent', 
          required:true,
          options:this.colorOptions,
          tooltip: "Choose which color from the palette will be the theme's accent color",
          class:'inline'
        },
      ]
    },
    {
      name:'Colors',
      class:'color-palette',
      label: true,
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
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg1', 
          width: this.colorWidth,
          placeholder: 'Foreground 1',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'fg2', 
          width: this.colorWidth,
          placeholder: 'Foreground 2',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg1', 
          width: this.colorWidth,
          placeholder: 'Alt Background 1',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-bg2', 
          width: this.colorWidth,
          placeholder: 'Alt Background 2',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg1', 
          width: this.colorWidth,
          placeholder: 'Alt Foreground 1',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'alt-fg2', 
          width: this.colorWidth,
          placeholder: 'Alt Foreground 2',
          required:true,
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
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'orange', 
          width: this.colorWidth,
          placeholder: 'Orange',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'red', 
          width: this.colorWidth,
          placeholder: 'Red',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'magenta', 
          width: this.colorWidth,
          placeholder: 'Magenta',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'violet', 
          width: this.colorWidth,
          placeholder: 'Violet',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'blue', 
          width: this.colorWidth,
          placeholder: 'Blue',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'cyan', 
          width: this.colorWidth,
          placeholder: 'Cyan',
          required:true,
          tooltip: 'Pick a color, any color!',
          class:'inline'
        },
        { 
          type: 'colorpicker', 
          name: 'green', 
          width: this.colorWidth,
          placeholder: 'Green',
          required:true,
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
      if(this.globalPreview){
        this.updateGlobal(theme);
      }
    }

    get globalPreview(){
      return this._globalPreview;
    }

    set globalPreview(state:boolean){
      let theme:Theme; 
      if(state){
        //theme = this.themeService.findTheme(this.values);
        theme = this.values;
      } else {
        theme = this.themeService.currentTheme();
      }
      //DEBUG: console.log(state);
      this._globalPreview = state;
      this.updateGlobal(theme);
      this.updatePreview(this.values);
    }

    custActions: any[] = [
      {
        id:'update-preview',
        name:'Update Preview',
        eventName: "UpdatePreview"
      }
    ]

    constructor(
      protected router: Router, 
      protected rest: RestService,
      protected ws: WebSocketService,
      private core: CoreService,
      private dialog: DialogService,
      protected matdialog: MatDialog,
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
      this.baseThemes = this.themeService.allThemes;
      console.warn(this.baseThemes);
      this.setupColorOptions(this.colors);
      this.loadValues(this.themeService.activeTheme);

      this.core.register({observerClass:this,eventName:"ThemeListsChanged"}).subscribe((evt:CoreEvent) => {
        this.baseThemes = this.themeService.allThemes;
      });

      this.customThemeForm.subscribe((evt:CoreEvent) => {
        switch(evt.name){
          case "FormSubmitted":
            console.log("Form Submitted");
            console.log(evt.data);
            let valid:boolean = this.validateForm(evt.data);
            if(valid){
              console.log("Form was Valid!");
              evt.data.accentColors = ['blue', 'orange','green', 'violet','cyan', 'magenta', 'yellow','red'];
              this.core.emit({name:"AddCustomThemePreference",data:evt.data});
              this.router.navigate(['ui-preferences']);
            }
          break;
          case "FormCancelled":
            console.log("Form Cancelled");
          break;
          case "FormGroupValueChanged":
          case "UpdatePreview":
            if(this.globalPreview){
              this.updateGlobal(evt.data);
            }
            this.updatePreview(evt.data);
          break;
          default:
            //console.log(evt);
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
      //console.log(themeName);
      //console.log(this.baseTheme);
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
      palette.splice(0,6);

      palette.forEach(function(color){
        values[color] = ct[color];
      });

      this.values = values;
      console.log(this.values);
      
    }

    updatePreview(theme:Theme){
      let palette = Object.keys(theme);
      palette.splice(0,5);
      
      palette.forEach(function(color){
      let swatch = theme[color];
      (<any>document).querySelector('#theme-preview').style.setProperty("--" + color, theme[color]);
      });
    }

    updateGlobal(theme:Theme){
      let palette = Object.keys(theme);
      palette.splice(0,5);
      
      palette.forEach(function(color){
        let swatch = theme[color];
      //console.log("Setting " + color + " to " + theme[color]);
        (<any>document).documentElement.style.setProperty("--" + color, theme[color]);
      });
        (<any>document).documentElement.style.setProperty("--primary",theme["primary"]);
        (<any>document).documentElement.style.setProperty("--accent",theme["accent"]);
    }

    generateFieldConfig(){
      for(let i in this.fieldSets){
        for(let ii in this.fieldSets[i].config){
          this.fieldConfig.push(this.fieldSets[i].config[ii]);
        }
      }
    }

    validateForm(data:any){
      let messages: string[] = [];
      Object.keys(this.fieldSets).forEach((set) => {
        let fieldset = this.fieldSets[set];
        for(let i = 0; i < fieldset.config.length; i++){
          let field = fieldset.config[i];

          //Check for required fields
          if(field.required && !data[field.name]){
            //console.warn(field.name + "*** Form Invalid ***");
            messages.push(field.placeholder + " is a required field.");

          } else if(field.required){
            //console.warn(field.name);
          } else {
            //console.log(field.name);
          }
        }
      });
        // Check for duplicate theme names and labels
        let dupeName = this.isDuplicateOf("name",data.name);
        if(dupeName){
          messages.push("This theme name is already taken. Please choose another name.")
        }

        let dupeLabel = this.isDuplicateOf("label",data.label);
        if(dupeLabel){
          messages.push("This theme label is already taken. Please choose another label.")
        }
      if(messages.length == 0){
        return true;
      }
      
      this.invalidDialog(messages);

      return false;
    }

    isDuplicateOf(key:string, value:any):Theme{
      for(let i = 0; i < this.baseThemes.length; i++){
        if(this.baseThemes[i][key] == value){
          return this.baseThemes[i];
        }
      }
    }

    invalidDialog(messages:string[]){
      let message:string = "";

      for(let i = 0; i < messages.length; i++){
        let num = i + 1;
        message += " " + messages[i];
      }


      //Info(T("Deleted Recovery Key"), T("Successfully deleted recovery key for volume ") + row1.name)
      this.dialog.Info(T("Form Invalid"), T(message)).subscribe((res) => {
        console.log(res);
      })
    }

}
