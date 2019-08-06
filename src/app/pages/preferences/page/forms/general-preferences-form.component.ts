import { ApplicationRef, Component, Injector, OnInit, OnChanges, OnDestroy } from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {RestService, WebSocketService} from 'app/services/';
import { MatSnackBar } from '@angular/material';
import { ThemeService, Theme} from 'app/services/theme/theme.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { Subject } from 'rxjs';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'general-preferences-form',
  template:`<entity-form-embedded fxFlex="100" [target]="target" [data]="values" [conf]="this"></entity-form-embedded>`
})
export class GeneralPreferencesFormComponent implements OnInit, OnChanges, OnDestroy {

  /*
   //Preferences Object Structure
   platform:string; // FreeNAS || TrueNAS
   timestamp:Date;
   userTheme:string; // Theme name
   customThemes?: Theme[];
   favoriteThemes?: string[]; // Theme Names
   showTooltips:boolean; // Form Tooltips on/off
   metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)

   */

  public target: Subject<CoreEvent> = new Subject();
  public values = [];
  public saveSubmitText = "Update Settings";
  protected isEntity: boolean = true; // was true
  private colorOptions: any[] = [];
  private themeOptions: any[] = [];
  private favoriteFields: any[] = []
  public fieldConfig:FieldConfig[] = [];
  public showTooltips:boolean = this.prefs.preferences.showTooltips;
  public allowPwToggle:boolean = this.prefs.preferences.allowPwToggle;;
  public enableWarning:boolean = this.prefs.preferences.enableWarning;
  public preferIconsOnly: boolean = this.prefs.preferences.preferIconsOnly;
  public fieldSetDisplay:string = 'no-margins';//default | carousel | stepper
    public fieldSets: FieldSet[] = [
      {
        name:'General Preferences',
        class:'preferences',
        label:true,
        config:[
          {
            type: 'select',
            name: 'userTheme',
            placeholder: 'Choose Theme',
            options: this.themeOptions,
            value:this.prefs.preferences.userTheme,
            tooltip:'Choose a preferred theme.',
            class:'inline'
          },
          {
            type: 'checkbox',
            name: 'preferIconsOnly',
            placeholder: 'Prefer buttons with icons only',
            value:this.preferIconsOnly,
            tooltip: 'Preserve screen space with icons and tooltips instead of text labels.',
            class:'inline'
          },
          {
            type: 'checkbox',
            name: 'showTooltips',
            placeholder: 'Enable Help Text in Forms',
            value: this.showTooltips,
            tooltip: 'Display help icons in forms.',
            class:'inline'
          },
          {
            type: 'checkbox',
            name: 'allowPwToggle',
            placeholder: 'Enable Password Toggle',
            value:this.allowPwToggle,
            tooltip: 'This option enables/disables a password toggle button.',
            class:'inline'
          },
          {
            type: 'checkbox',
            name: 'enableWarning',
            placeholder: 'Enable "Save Configuration" Dialog Before Upgrade',
            value:this.enableWarning,
            tooltip: T('Show or hide a dialog to save the system\
                        configuration file. This dialog appears\
                        after choosing to upgrade the system.'),
            class:'inline'
          }
        ]
      }
    ]

    constructor(
      protected router: Router,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      public themeService:ThemeService,
      public prefs:PreferencesService,
      public snackBar: MatSnackBar,
      private core:CoreService
    ) {}

    ngOnInit(){
      // Get current preferences so for form values
      this.init();
    }
    
    afterInit(entity: any) {
      entity.formGroup.controls['userTheme'].valueChanges.subscribe((theme) => {
        this.themeService.changeTheme(theme);
      })
    }

    ngOnChanges(changes){
      if(changes.baseTheme){
        alert("baseTheme Changed!")
      }
    }

    ngOnDestroy(){
      this.core.unregister({observerClass:this});
    }

    init(){
      this.setThemeOptions();
      this.core.register({observerClass:this,eventName:"ThemeListsChanged"}).subscribe((evt:CoreEvent) => {
        this.setThemeOptions();
      });
      //this.setFavoriteFields();
      this.loadValues();
      this.target.subscribe((evt:CoreEvent) => {
        switch(evt.name){
        case "FormSubmitted":
          this.core.emit({name:"ChangePreferences",data:evt.data});
          this.snackBar.open(T('Changes Submitted'), T('close'), {
            duration: 3000
          });
          break;
        case "CreateTheme":
          this.router.navigate(new Array('').concat(['ui-preferences', 'create-theme']));
          break;
        }
      });
      this.generateFieldConfig();
    }

    /*afterInit(entityForm: any) {
     }*/

     /*setFavoriteFields(){
       for(let i = 0; i < this.themeService.freenasThemes.length; i++){
         let theme = this.themeService.freenasThemes[i];
         let field = {
           type: 'checkbox',
           name: theme.name,
           width: '200px',
           placeholder:theme.label,
           value: false,
           tooltip: 'Add ' + theme.label + ' to favorites',
           class:'inline'
         }
         this.favoriteFields.push(field);
       }
     }*/

     setThemeOptions(){
       this.themeOptions.splice(0,this.themeOptions.length);
       for(let i = 0; i < this.themeService.allThemes.length; i++){
         let theme = this.themeService.allThemes[i];
         this.themeOptions.push({label:theme.label, value: theme.name});
       }
     }

     processSubmission(obj:any){}

     loadValues(themeName?:string){
       this.enableWarning = this.prefs.preferences.enableWarning
       this.allowPwToggle = this.prefs.preferences.allowPwToggle
       this.showTooltips = this.prefs.preferences.showTooltips
       this.preferIconsOnly = this.prefs.preferences.preferIconsOnly;
     }

     generateFieldConfig(){
       for(let i in this.fieldSets){
         for(let ii in this.fieldSets[i].config){
           this.fieldConfig.push(this.fieldSets[i].config[ii]);
         }
       }
     }
}
