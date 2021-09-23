import {
  ApplicationRef, Component, Injector, OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from 'app/core/services/core-service/core.service';
import { WebSocketService } from 'app/services';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ui-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
})
export class PreferencesPageComponent implements OnDestroy {
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
