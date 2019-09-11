import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from 'app/core/services/api.service';
import { AnimationService } from 'app/core/services/animation.service';
import { InteractionManagerService } from 'app/core/services/interaction-manager.service';
import { CoreService } from 'app/core/services/core.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ChartDataUtilsService } from 'app/core/services/chart-data-utils.service';
import { WebSocketService } from 'app/services/ws.service';


/*
 *
 * This is the Core Module. By importing this module you'll 
 * ensure your page will have the right dependencies in place
 * to make use of the CoreService (event bus) and any helper
 * services that get added later on.
 *
 * Import this in app.module.ts and call it's forRoot() method
 *
 * */

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    CoreService,
    ApiService,
    AnimationService,
    InteractionManagerService,
    ThemeService,
    PreferencesService,
    ChartDataUtilsService,
    WebSocketService
  ],
  exports: [ // Modules and Components here
    CommonModule
  ]
})
export class CoreServices {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreServices,
      providers: [
	CoreService,
	ApiService,
	AnimationService,
        InteractionManagerService,
        PreferencesService,
        ThemeService,
        ChartDataUtilsService,
        WebSocketService
      ]
    }
  }
}
