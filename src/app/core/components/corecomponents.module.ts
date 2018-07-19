import { NgModule, ModuleWithProviders } from '@angular/core';
import { MaterialModule } from '../../appMaterial.module';
import { CommonModule } from '@angular/common';

import { PageComponent } from './page/page.component';
import { ViewComponent } from './view/view.component';
import { CardComponent } from './card/card.component';
import { ViewControlComponent } from './viewcontrol/viewcontrol.component';
import { ViewControllerComponent } from './viewcontroller/viewcontroller.component';
import { Display,DisplayContainer } from './display/display.component';
import { ViewButtonComponent } from './viewbutton/viewbutton.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule }   from '@angular/forms';
import { ViewChartComponent } from './viewchart/viewchart.component';
import { ViewChartPieComponent } from './viewchartpie/viewchartpie.component';
import { ViewChartDonutComponent } from './viewchartdonut/viewchartdonut.component';
import { ViewChartGaugeComponent } from './viewchartgauge/viewchartgauge.component';
import { ViewChartLineComponent } from './viewchartline/viewchartline.component';

import { WidgetComponent } from './widgets/widget/widget.component';
import { WidgetSysInfoComponent } from './widgets/widgetsysinfo/widgetsysinfo.component';
import { WidgetNetInfoComponent } from './widgets/widgetnetinfo/widgetnetinfo.component';
import { WidgetCpuHistoryComponent } from './widgets/widgetcpuhistory/widgetcpuhistory.component';
import { WidgetCpuTempsComponent } from './widgets/widgetcputemps/widgetcputemps.component';
import { WidgetLoadHistoryComponent } from './widgets/widgetloadhistory/widgetloadhistory.component';
import { WidgetMemoryHistoryComponent } from './widgets/widgetmemoryhistory/widgetmemoryhistory.component';
import { WidgetStorageComponent } from './widgets/widgetstorage/widgetstorage.component';
import { WidgetStorageCollectionComponent } from './widgets/widgetstoragecollection/widgetstoragecollection.component';
import { WidgetNoteComponent } from './widgets/widgetnote/widgetnote.component';
import { WidgetNotesCollectionComponent } from './widgets/widgetnotescollection/widgetnotescollection.component';
import { WidgetPoolComponent } from './widgets/widgetpool/widgetpool.component';

import { AnimationDirective } from '../directives/animation.directive';

import { TranslateModule } from '@ngx-translate/core';

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
    FlexLayoutModule,
    FormsModule,
    TranslateModule
  ],
  declarations: [
    AnimationDirective,
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
    ViewChartLineComponent,
    WidgetComponent,
    WidgetSysInfoComponent,
    WidgetNetInfoComponent,
    WidgetCpuHistoryComponent,
    WidgetCpuTempsComponent,
    WidgetLoadHistoryComponent,
    WidgetMemoryHistoryComponent,
    WidgetStorageComponent,
    WidgetStorageCollectionComponent,
    WidgetNoteComponent,
    WidgetNotesCollectionComponent,
    WidgetPoolComponent
  ],
  exports: [ // Modules and Components here
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    AnimationDirective,
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
    CardComponent,
    WidgetComponent,
    WidgetSysInfoComponent,
    WidgetNetInfoComponent,
    WidgetCpuHistoryComponent,
    WidgetCpuTempsComponent,
    WidgetLoadHistoryComponent,
    WidgetMemoryHistoryComponent,
    WidgetStorageComponent,
    WidgetStorageCollectionComponent,
    WidgetNoteComponent,
    WidgetNotesCollectionComponent,
    WidgetPoolComponent
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
    CardComponent,
    WidgetComponent,
    WidgetSysInfoComponent,
    WidgetNetInfoComponent,
    WidgetCpuHistoryComponent,
    WidgetCpuTempsComponent,
    WidgetLoadHistoryComponent,
    WidgetMemoryHistoryComponent,
    WidgetStorageComponent,
    WidgetStorageCollectionComponent,
    WidgetNoteComponent,
    WidgetNotesCollectionComponent,
    WidgetPoolComponent
  ]
})
export class CoreComponents {}
