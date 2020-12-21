import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, ViewContainerRef, OnChanges, OnDestroy } from '@angular/core';
import { NgModel }   from '@angular/forms';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import {RestService, WebSocketService} from '../../../services/';
import { ThemeService, Theme} from 'app/services/theme/theme.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';

@Component({
  selector : 'ui-preferences',
  template:`
  <mat-card class="prefs-card">
  <!--<mat-toolbar-row style="margin-bottom:16px;">
  <h4>User Preferences</h4>
  </mat-toolbar-row>
  <mat-divider></mat-divider>-->
  <mat-card-content>
    <general-preferences-form  class="prefs-form"></general-preferences-form>
  </mat-card-content>
  <mat-divider></mat-divider>
  <mat-card-content *ngIf="themeService && themeService.customThemes && themeService.customThemes.length > 0">
    <custom-theme-manager-form  class="prefs-form"></custom-theme-manager-form>
  </mat-card-content>

  </mat-card>
  `,
  styleUrls: ['./preferences.component.css']
})
export class PreferencesPage implements OnDestroy {

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

    constructor(
      protected router: Router,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      public themeService:ThemeService,
      private core:CoreService
    ) {}

    ngOnDestroy(){
      this.core.unregister({observerClass:this});
    }

}
