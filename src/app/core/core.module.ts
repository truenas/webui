import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
//import { SubComponent } from './decorators/subcomponent';

// Views
import { View } from './components/view/view.component';

// ViewControllers
import { ViewController } from './components/view-controller/view-controller.component';
import { Page } from './components/page/page.component';

// Services
import { CoreService } from './services/core.service';
import { ApiService } from './services/api.service';




/*
 *
 * This is the Core Module. By extending this module you'll 
 * ensure your page will have the right dependencies in place
 * to make use of the CoreService (event bus) and any helper
 * services that get added later on.
 *
 * */

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    View,
    ViewController,
    Page
  ],
  providers: [
    CoreService,
    ApiService
  ],
  exports: [ // Modules and Components here
    CommonModule,
    View,
    ViewController,
    Page
  ]
})
export class CoreModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [ // Services here
	CoreService,
	ApiService
      ]
    }
  }
}
