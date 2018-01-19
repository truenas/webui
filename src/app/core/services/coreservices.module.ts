import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from 'app/core/services/api.service';
import { CoreService } from 'app/core/services/core.service';
import { ThemeService } from 'app/services/theme/theme.service';


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
    ThemeService
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
        ThemeService
      ]
    }
  }
}
