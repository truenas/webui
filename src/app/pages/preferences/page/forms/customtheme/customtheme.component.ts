import { ApplicationRef, Component, Injector, OnInit, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import {RestService, WebSocketService} from 'app/services/';
import { ThemeService, Theme } from 'app/services/theme/theme.service';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material';
import { DialogService } from 'app/services/dialog.service';
import { T } from 'app/translate-marker';

interface FormSnapshot {
  theme:any;
  baseTheme?:string;
}

@Component({
  selector : 'custom-theme',
  templateUrl : './customtheme.component.html',
  styleUrls: ['./customtheme.component.css'],
})
export class CustomThemeComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  public saveSubmitText = "Save Custom Theme";
  public customThemeForm: Subject<CoreEvent> = new Subject();// formerly known as target
  public loadValuesForm: Subject<CoreEvent> = new Subject();// formerly known as target
  private _baseTheme:any; //= this.themeService.activeTheme;
  private _globalPreview:boolean = true;
  public baseThemes: Theme[];
  public snapshot:FormSnapshot;
  customThemeFormConfig:FormConfig = {};// see if we can use this instead of passing this whole component in
  protected isEntity: boolean = true; // was true
  public hiddenFieldSets: string[] = ['Colors'];
  public currentTab:string = 'General';

  // EXAMPLE THEME
  public values:Theme = {
    name:'New Theme',
    description:'',
    label:'',
    labelSwatch:'',
    hasDarkLogo:false,
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
      label: false,
      class:'general',
      width:'300px',
      config:[
        {
          type: 'input',
          name: 'name',
          width:'100%',
          placeholder: 'Custom Theme Name',
          required:true,
          tooltip: 'Enter a name to identify the new theme.',
        },
        {
          type: 'input',
          name: 'label',
          width:'100%',
          placeholder: 'Menu Label',
          required:true,
          tooltip: 'Enter a short name for the theme. The Menu Label is \
                    shown when the theme is listed in Preferences.'
        },
        // Not using this now, but theme preview breaks if it isn't here...
        {
          type: 'select',
          name: 'labelSwatch',
          width:'100%',
          placeholder: 'Menu Swatch',
          required:false,
          isHidden: true,
          options:this.colorOptions,
          tooltip: "Choose the color to display next to the Menu Label \
                    in the Favorites menu.",
          class:'inline'

        },
        { type: 'input',
          name : 'description',
          width:'100%',
          placeholder : 'Description',
          tooltip: 'Enter a short description of the theme.',
        },
        {
          type: 'checkbox',
          name: 'hasDarkLogo',
          width:'100%',
          placeholder: 'Enable Dark Logo',
          tooltip: `Enable this to give the FreeNAS Logo a dark fill color`,
          class:'inline'
        },
        {
          type: 'select',
          name: 'primary',
          width:'100%',
          placeholder: 'Choose Primary',
          required:true,
          options:this.colorOptions,
          tooltip: "Choose the primary color for the theme.",
          class:'inline'
        },
        {
          type: 'select',
          name: 'accent',
          width:'100%',
          placeholder: 'Choose Accent',
          required:true,
          options:this.colorOptions,
          tooltip: "Choose the accent color for the theme.",
          class:'inline'
        },
      ]
    },
    {
      name:'Colors',
      class:'color-palette',
      label: false,
      width:'calc(100% - 300px)',
      config:[
        {
         type: 'colorpicker',
         name: 'bg1',
         width: this.colorWidth,
         placeholder: 'Background 1',
         tooltip: 'Click the swatch to pick a color or enter a color \
                   hex value.',
         class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'bg2',
          width: this.colorWidth,
          placeholder: 'Background 2',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'fg1',
          width: this.colorWidth,
          placeholder: 'Foreground 1',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'fg2',
          width: this.colorWidth,
          placeholder: 'Foreground 2',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'alt-bg1',
          width: this.colorWidth,
          placeholder: 'Alt Background 1',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'alt-bg2',
          width: this.colorWidth,
          placeholder: 'Alt Background 2',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'alt-fg1',
          width: this.colorWidth,
          placeholder: 'Alt Foreground 1',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'alt-fg2',
          width: this.colorWidth,
          placeholder: 'Alt Foreground 2',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'yellow',
          width: this.colorWidth,
          placeholder: 'Yellow',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'orange',
          width: this.colorWidth,
          placeholder: 'Orange',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'red',
          width: this.colorWidth,
          placeholder: 'Red',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'magenta',
          width: this.colorWidth,
          placeholder: 'Magenta',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'violet',
          width: this.colorWidth,
          placeholder: 'Violet',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'blue',
          width: this.colorWidth,
          placeholder: 'Blue',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'cyan',
          width: this.colorWidth,
          placeholder: 'Cyan',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
          class:'inline'
        },
        {
          type: 'colorpicker',
          name: 'green',
          width: this.colorWidth,
          placeholder: 'Green',
          required:true,
          tooltip: 'Click the swatch to pick a color or enter a color \
                    hex value.',
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
      let theme = this.themeService.findTheme(name);
      this.snapshot = {theme:theme,baseTheme:this._baseTheme};
      this.loadValues(name);
      this.updatePreview(theme);
      if(this.globalPreview){
        this.updateGlobal(this.snapshot);
      }
    }

    get globalPreview(){
      return this._globalPreview;
    }

    set globalPreview(state:boolean){
      if(state){
        this.updateGlobal(this.snapshot);
      } else {
        this.updateGlobal();
      }
      this._globalPreview = state;
    }

    custActions: any[] = [
      {
        id:'cancel',
        name:'Cancel',
        eventName: "FormCancelled"
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

    ngAfterViewInit(){
      this.updateGlobal();
    }

    ngOnChanges(changes){
    }

    ngOnDestroy(){
      this.core.unregister({observerClass:this});
      this.globalPreview = true;
      this.updateGlobal();
    }

    init(){
      this.baseThemes = this.themeService.allThemes;
      this.setupColorOptions(this.colors);

      if(this.themeService.globalPreview){
        let data = this.themeService.globalPreviewData;
        this.globalPreview = true;
        this.snapshot = {theme:data.theme};// ignore basetheme
        this.loadValues();
      } else {
        this.baseTheme = this.themeService.activeTheme;
        this.loadValues(this.themeService.activeTheme);
      }

      this.core.register({observerClass:this,eventName:"ThemeListsChanged"}).subscribe((evt:CoreEvent) => {
        this.baseThemes = this.themeService.allThemes;
      });

      this.customThemeForm.subscribe((evt:CoreEvent) => {
        switch(evt.name){
          case "FormSubmitted":
            let valid:boolean = this.validateForm(evt.data);
             if(valid){
              evt.data.labelSwatch = evt.data.primary.slice(6, -1);
              evt.data.accentColors = ['blue', 'orange','green', 'violet','cyan', 'magenta', 'yellow','red'];
              this.core.emit({name:"AddCustomThemePreference",data:evt.data});
              this.globalPreview = false;
              this.updateGlobal();
              this.router.navigate(['ui-preferences']);
            }
          break;
          case "FormCancelled":
              this.globalPreview = false;
              this.updateGlobal();
              this.router.navigate(['ui-preferences']);
          break;
          case "FormGroupValueChanged":
          case "UpdatePreview":
            this.snapshot = {theme:evt.data, baseTheme:this.baseTheme}
            if(this.globalPreview){
              setTimeout(() => {
                this.updateGlobal(this.snapshot);
              })
            }
            this.updatePreview(evt.data);
          break;
          default:
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


      let values = Object.assign({},this.values);
      let theme:Theme;
      if(this.globalPreview){
        theme = this.snapshot.theme;
      } else if(!themeName){
        theme = this.themeService.currentTheme();
      } else {
        theme = this.themeService.findTheme(themeName);
      }

      let ct = Object.assign({},theme);
      let palette = Object.keys(ct);
      palette.splice(0,4);

      palette.forEach((color)=>{
        values[color] = ct[color];
      });

      this.values = values;
    }

    updatePreview(theme:Theme){
      let palette = Object.keys(theme);
      palette.splice(0,5);
      
      palette.forEach((color)=>{
      let swatch = theme[color];
      (<any>document).querySelector('#theme-preview').style.setProperty("--" + color, theme[color]);
      });
    }

    updateGlobal(snapshot?:FormSnapshot){
      if(snapshot){
        // Turn it on in theme service
        this.core.emit({name:"GlobalPreviewChanged", data:snapshot});
      } else {
        //turn it off in theme service
        this.core.emit({name:"GlobalPreviewChanged"});
      }
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
          messages.push("This name is already being used by an existing theme. Please choose a new name.")
        }

        let dupeLabel = this.isDuplicateOf("label",data.label);
        if(dupeLabel){
          messages.push("This label is already being used by an existing theme. Please choose a new label.")
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
        //console.log(res);
      })
    }

    hideFieldSet(name:string){
      if(name == 'All'){
        this.currentTab = 'Preview';
        this.hiddenFieldSets = ['General', 'Colors'];
        return;
      }

      this.hiddenFieldSets = [name];
      this.currentTab = name == 'Colors' ? 'General' : 'Colors' ;
    }
}
