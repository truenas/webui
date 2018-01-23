import { NgModule, ModuleWithProviders } from '@angular/core';
import { MaterialModule } from '../../appMaterial.module';
import { CommonModule } from '@angular/common';

import { PageComponent } from 'app/core/components/page/page.component';
import { ViewComponent } from 'app/core/components/view/view.component';
import { CardComponent } from 'app/core/components/card/card.component';
import { ViewControlComponent } from 'app/core/components/viewcontrol/viewcontrol.component';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { Display,DisplayContainer } from 'app/core/components/display/display.component';
import { ViewButtonComponent } from './viewbutton/viewbutton.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ViewChartComponent } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartGaugeComponent } from './viewchartgauge/viewchartgauge.component';
import { ViewChartLineComponent } from './viewchartline/viewchartline.component';

/*
 *
 * This is the Core Module. By importing this module you'll 
 * ensure your page will have the right dependencies in place
 * to make use of Core Components
 *
 * */

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule
  ],
  declarations: [
    PageComponent,
    ViewComponent,
    CardComponent,
    ViewControlComponent,
    ViewControllerComponent,
    Display,
    DisplayContainer,
    ViewButtonComponent,
    ViewChartComponent,
    ViewChartDonutComponent,
    ViewChartPieComponent,
    ViewChartGaugeComponent,
    ViewChartLineComponent
  ],
  exports: [ // Modules and Components here
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    Display,
    DisplayContainer,
    PageComponent,
    ViewComponent,
    ViewChartComponent,
    ViewChartDonutComponent,
    ViewChartGaugeComponent,
    ViewChartPieComponent,
    ViewChartLineComponent,
    ViewControlComponent,
    ViewButtonComponent,
    ViewControllerComponent,
    CardComponent
  ],
  entryComponents:[
    DisplayContainer,
    ViewComponent,
    ViewChartComponent,
    ViewChartDonutComponent,
    ViewChartGaugeComponent,
    ViewChartPieComponent,
    ViewChartLineComponent,
    ViewControlComponent,
    ViewButtonComponent,
    ViewControllerComponent,
    CardComponent
  ]
})
export class CoreComponents {}
