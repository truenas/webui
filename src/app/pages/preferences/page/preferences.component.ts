import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef, OnChanges } from '@angular/core';
import { NgModel }   from '@angular/forms';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import {RestService, WebSocketService} from '../../../services/';
import { ThemeService, Theme} from 'app/services/theme/theme.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'ui-preferences',
  template:`
  <mat-card>
  <mat-toolbar-row style="margin-bottom:16px;">
  <h4>User Preferences</h4>
  </mat-toolbar-row>
  <mat-divider></mat-divider>
  <mat-card-content fxLayout="row wrap" fxLayoutAlign="space-between start" style="margin-top:32px;">
    <general-preferences-form fxFlex="100" fxFlex.gt-xs="300px" class="prefs-form"></general-preferences-form>
    <custom-theme-manager-form fxFlex="100" fxFlex.gt-xs="calc(100% - 300px)" class="prefs-form"></custom-theme-manager-form>
      <div fxFlex="100" fxFlex.gt-xs="calc(100% - 300px)"></div>
        </mat-card-content>
        </mat-card>
        `
})
export class PreferencesPage implements OnInit {

  /*
   //Preferences Object Structure
   platform:string; // FreeNAS || TrueNAS
   timestamp:Date;
   userTheme:string; // Theme name
   customThemes?: Theme[]; 
   favoriteThemes?: string[]; // Theme Names
   showGuide:boolean; // Guided Tour on/off
   showTooltips:boolean; // Form Tooltips on/off
   metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)

   */

  //public target: Subject<CoreEvent> = new Subject();

    constructor(
      protected router: Router, 
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector, 
      protected _appRef: ApplicationRef,
      public themeService:ThemeService,
      private core:CoreService
    ) {}

    ngOnInit(){
      //this.init();
    }

    /*ngOnChanges(changes){
      if(changes.baseTheme){
        alert("baseTheme Changed!")
      }
    }

    init(){
      this.setThemeOptions();
      this.core.register({observerClass:this,eventName:"ThemeListsChanged"}).subscribe((evt:CoreEvent) => {
        this.setThemeOptions();
      });
      this.setFavoriteFields();
      this.loadValues();
      this.target.subscribe((evt:CoreEvent) => {
        switch(evt.name){
        case "FormSubmitted":
          console.log("Form Submitted");
          //console.log(evt.data);
          this.core.emit({name:"ChangePreferences",data:evt.data});
          break;
        case "CreateTheme":
          this.router.navigate(new Array('').concat(['ui-preferences', 'create-theme']));
          break;
        }
      });
      this.generateFieldConfig();
    }

   
  

     setFavoriteFields(){
       for(let i = 0; i < this.themeService.freenasThemes.length; i++){
         let theme = this.themeService.freenasThemes[i];
         let field = { 
           type: 'checkbox', 
           name: theme.name,
           width: '200px',
           placeholder:theme.label,
           value: false,
           tooltip: 'Add ' + theme.label + ' to your favorites',
           class:'inline'
         }
         this.favoriteFields.push(field);
       }   
     }

     setThemeOptions(){
       console.log("******** SETTING THEME OPTIONS ********");
       console.log(this.themeService.allThemes);
       this.themeOptions.splice(0,this.themeOptions.length);
       for(let i = 0; i < this.themeService.allThemes.length; i++){
         let theme = this.themeService.allThemes[i];
         this.themeOptions.push({label:theme.label, value: theme.name});
       }
     }

     processSubmission(obj:any){
     }

     loadValues(themeName?:string){

     }

     generateFieldConfig(){
       for(let i in this.fieldSets){
         for(let ii in this.fieldSets[i].config){
           this.fieldConfig.push(this.fieldSets[i].config[ii]);
         }
       }
     }*/
}
