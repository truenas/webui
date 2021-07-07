import {
  ApplicationRef, Component, Injector, OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from 'app/core/services/core-service/core.service';
import { WebSocketService } from 'app/services';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ui-preferences',
  template: `
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
  styleUrls: ['./preferences.component.scss'],
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
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    public themeService: ThemeService,
    private core: CoreService,
  ) {}

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }
}
