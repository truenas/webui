import { ApplicationRef, Component, Injector, OnInit, AfterViewInit, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { EntityFormEmbeddedComponent } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {RestService, WebSocketService} from 'app/services/';
import { MatSnackBar } from '@angular/material';
import { ThemeService, Theme} from 'app/services/theme/theme.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { Subject } from 'rxjs';
import { T } from '../../../../translate-marker';

interface UserPreferences {
  //Preferences Object Structure
  platform:string; // FreeNAS || TrueNAS
  timestamp:Date;
  userTheme:string; // Theme name
  customThemes?: Theme[];
  favoriteThemes?: string[]; // Theme Names
  showTooltips?:boolean; // Form Tooltips on/off // Deprecated
  metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)
}
   
@Component({
  selector : 'general-preferences-form',
  template:`<div><button (click)="test()">Trigger</button></div><br><entity-form-embedded *ngIf="preferences" #embeddedForm fxFlex="100" [target]="target" [data]="values" [conf]="this"></entity-form-embedded>`
})
export class GeneralPreferencesFormComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('embeddedForm', {static: false}) embeddedForm: EntityFormEmbeddedComponent;
  public target: Subject<CoreEvent> = new Subject();
  public values = [];
  public preferences: any;
  public saveSubmitText = T("Update Settings");
  protected isEntity: boolean = true; // was true
  private themeOptions: any[] = [];
  public fieldConfig:FieldConfig[] = [];
  public fieldSetDisplay:string = 'no-margins';//default | carousel | stepper
  public fieldSets: FieldSet[] = [
    {
      name:T('General Preferences'),
      class:'preferences',
      label:true,
      config: []
    }
  ]

    constructor(
      protected router: Router,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      public themeService:ThemeService,
      public snackBar: MatSnackBar,
      private core:CoreService
    ) {
    }

    ngOnInit(){
      this.core.emit({name:"UserPreferencesRequest", sender:this});
      this.core.register({observerClass:this,eventName:"UserPreferencesChanged"}).subscribe((evt:CoreEvent) => {
        this.preferences = evt.data;
        this.onPreferences(evt.data);
        this.init();
      });
    }

    ngAfterViewInit(){
    }
    
    afterInit(entity: any) {
      entity.formGroup.controls['userTheme'].valueChanges.subscribe((theme) => {
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
        if(!this.embeddedForm){ return; }
        
        let theme = this.preferences.userTheme;
        this.embeddedForm.setValue('userTheme', theme);
      });

      this.target.subscribe((evt:CoreEvent) => {
        switch(evt.name){
        case "FormSubmitted":
          this.core.emit({name:"ChangePreferences",data:evt.data});
          break;
        case "CreateTheme":
          this.router.navigate(new Array('').concat(['ui-preferences', 'create-theme']));
          break;
        }
      });
      this.generateFieldConfig();
    }

     setThemeOptions(){
       this.themeOptions.splice(0,this.themeOptions.length);
       for(let i = 0; i < this.themeService.allThemes.length; i++){
         let theme = this.themeService.allThemes[i];
         this.themeOptions.push({label:theme.label, value: theme.name});
       }
     }

     onPreferences(prefs){
      this.fieldSets[0].config = [
        {
          type: 'select',
          name: 'userTheme',
          placeholder: T('Choose Theme'),
          options: this.themeOptions,
          value:prefs.userTheme,
          tooltip:T('Choose a preferred theme.'),
          class:'inline'
        },
        {
          type: 'checkbox',
          name: 'preferIconsOnly',
          placeholder: T('Prefer buttons with icons only'),
          value:prefs.preferIconsOnly,
          tooltip: T('Preserve screen space with icons and tooltips instead of text labels.'),
          class:'inline'
        },
        {
          type: 'checkbox',
          name: 'allowPwToggle',
          placeholder: T('Enable Password Toggle'),
          value:prefs.allowPwToggle,
          tooltip: T('This option enables/disables a password toggle button.'),
          class:'inline'
        }
      ]
    }

     generateFieldConfig(){
       for(let i in this.fieldSets){
         for(let ii in this.fieldSets[i].config){
           this.fieldConfig.push(this.fieldSets[i].config[ii]);
         }
       }
     }

     test(){
      console.log("Clicked!");
     }
}
