import { CommonModule } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { AnimationService } from 'app/core/services/animation.service';
import { ApiService } from 'app/core/services/api.service';
import { ChartDataUtilsService } from 'app/core/services/chart-data-utils.service';
import { CoreService } from 'app/core/services/core-service/core.service';
import { DiskStateService } from 'app/core/services/disk-state/disk-state.service';
import { DiskTemperatureService } from 'app/core/services/disk-temperature.service';
import { InteractionManagerService } from 'app/core/services/interaction-manager.service';
import { LayoutService } from 'app/core/services/layout.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ThemeService } from 'app/services/theme/theme.service';
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
    DiskStateService,
    DiskTemperatureService,
    AnimationService,
    InteractionManagerService,
    ThemeService,
    PreferencesService,
    ChartDataUtilsService,
    WebSocketService,
  ],
  exports: [ // Modules and Components here
    CommonModule,
  ],
})
export class CoreServices {
  static forRoot(): ModuleWithProviders<CoreServices> {
    return {
      ngModule: CoreServices,
      providers: [
        CoreService,
        ApiService,
        DiskStateService,
        DiskTemperatureService,
        AnimationService,
        InteractionManagerService,
        PreferencesService,
        LayoutService,
        ThemeService,
        ChartDataUtilsService,
        WebSocketService,
      ],
    };
  }
}
