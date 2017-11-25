import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from 'app/core/components/view/view.component';
import { ViewController } from 'app/core/components/view-controller/view-controller';
import { Page } from 'app/core/components/page/page.component';
//import { CoreService } from 'app/core/services/core.service';
//import { ApiService } from 'app/core/services/api.service';
//import { SubComponent } from './decorators/subcomponent';





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
    //CoreService,
    //ApiService
  ],
  exports: [ // Modules and Components here
    CommonModule,
    View,
    ViewController,
    Page
  ]
})
export class CoreModule {
}
