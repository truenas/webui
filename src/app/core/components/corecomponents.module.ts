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
import { FormsModule }   from '@angular/forms';
import { C3ChartComponent } from 'app/core/components/c3chart/c3chart.component';
import { ViewChartComponent } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartGaugeComponent } from './viewchartgauge/viewchartgauge.component';
import { ViewChartLineComponent } from './viewchartline/viewchartline.component';
import { StorageService } from '../../services/storage.service';

import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { WidgetChartComponent } from 'app/core/components/widgets/widgetchart/widgetchart.component';
import { WidgetSysInfoComponent } from 'app/core/components/widgets/widgetsysinfo/widgetsysinfo.component';
import { WidgetNetInfoComponent } from 'app/core/components/widgets/widgetnetinfo/widgetnetinfo.component';
import { WidgetCpuComponent } from 'app/core/components/widgets/widgetcpu/widgetcpu.component';
import { WidgetCpuHistoryComponent } from 'app/core/components/widgets/widgetcpuhistory/widgetcpuhistory.component';
import { WidgetCpuTempsComponent } from 'app/core/components/widgets/widgetcputemps/widgetcputemps.component';
import { WidgetLoadHistoryComponent } from 'app/core/components/widgets/widgetloadhistory/widgetloadhistory.component';
import { WidgetLoadComponent } from 'app/core/components/widgets/widgetload/widgetload.component';
import { WidgetMemoryHistoryComponent } from 'app/core/components/widgets/widgetmemoryhistory/widgetmemoryhistory.component';
import { WidgetStorageComponent } from 'app/core/components/widgets/widgetstorage/widgetstorage.component';
import { WidgetStorageCollectionComponent } from 'app/core/components/widgets/widgetstoragecollection/widgetstoragecollection.component';
import { WidgetNoteComponent } from 'app/core/components/widgets/widgetnote/widgetnote.component';
import { WidgetNotesCollectionComponent } from 'app/core/components/widgets/widgetnotescollection/widgetnotescollection.component';
import { WidgetPoolComponent } from 'app/core/components/widgets/widgetpool/widgetpool.component';


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
    PageComponent,
    ViewComponent,
    CardComponent,
    ViewControlComponent,
    ViewControllerComponent,
    Display,
    DisplayContainer,
    ViewButtonComponent,
    C3ChartComponent,
    ViewChartComponent,
    ViewChartDonutComponent,
    ViewChartPieComponent,
    ViewChartGaugeComponent,
    ViewChartLineComponent,
    WidgetComponent,
    WidgetChartComponent,
    WidgetSysInfoComponent,
    WidgetNetInfoComponent,
    WidgetCpuComponent,
    WidgetCpuHistoryComponent,
    WidgetCpuTempsComponent,
    WidgetLoadHistoryComponent,
    WidgetLoadComponent,
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
    Display,
    DisplayContainer,
    PageComponent,
    ViewComponent,
    C3ChartComponent,
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
    WidgetChartComponent,
    WidgetSysInfoComponent,
    WidgetNetInfoComponent,
    WidgetCpuComponent,
    WidgetCpuHistoryComponent,
    WidgetCpuTempsComponent,
    WidgetLoadHistoryComponent,
    WidgetLoadComponent,
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
    C3ChartComponent,
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
    WidgetChartComponent,
    WidgetSysInfoComponent,
    WidgetNetInfoComponent,
    WidgetCpuComponent,
    WidgetCpuHistoryComponent,
    WidgetCpuTempsComponent,
    WidgetLoadHistoryComponent,
    WidgetLoadComponent,
    WidgetMemoryHistoryComponent,
    WidgetStorageComponent,
    WidgetStorageCollectionComponent,
    WidgetNoteComponent,
    WidgetNotesCollectionComponent,
    WidgetPoolComponent
  ],
  providers:[
    StorageService
  ]
})
export class CoreComponents {}
