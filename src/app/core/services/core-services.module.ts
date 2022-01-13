import { CommonModule } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { ApiService } from 'app/core/services/api.service';
import { CoreService } from 'app/core/services/core-service/core.service';
import { DiskStateService } from 'app/core/services/disk-state/disk-state.service';
import { DiskTemperatureService } from 'app/core/services/disk-temperature.service';
import { LayoutService } from 'app/core/services/layout.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    CoreService,
    ApiService,
    DiskStateService,
    DiskTemperatureService,
    ThemeService,
    PreferencesService,
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
        PreferencesService,
        LayoutService,
        ThemeService,
        WebSocketService,
      ],
    };
  }
}
