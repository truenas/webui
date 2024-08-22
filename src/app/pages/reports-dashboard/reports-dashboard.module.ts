import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/forms/ix-dynamic-form/ix-dynamic-form.module';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { IxDateComponent } from 'app/modules/pipes/ix-date/ix-date.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { ReportingExporterListComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-list/reporting-exporters-list.component';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import {
  NetdataDialogComponent,
} from 'app/pages/reports-dashboard/components/reports-global-controls/netdata-dialog/netdata-dialog.component';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';
import { routing } from 'app/pages/reports-dashboard/reports-dashboard.routing';
import { PlotterService } from 'app/pages/reports-dashboard/services/plotter.service';
import { SmoothPlotterService } from 'app/pages/reports-dashboard/services/smooth-plotter.service';
import { ReportComponent } from './components/report/report.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IxFormsModule,
    IxDynamicFormModule,
    routing,
    ScrollingModule,
    MatButtonModule,
    IxDateComponent,
    AppLoaderModule,
    IxTableModule,
    MatToolbarModule,
    TranslateModule,
    EntityModule,
    MatTooltipModule,
    IxIconModule,
    MatMenuModule,
    MatCardModule,
    CommonDirectivesModule,
    LayoutModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    TestIdModule,
    MatDialogModule,
    EmptyComponent,
    SearchInput1Component,
    MapValuePipe,
  ],
  declarations: [
    LineChartComponent,
    ReportComponent,
    ReportingExportersFormComponent,
    ReportingExporterListComponent,
    ReportsDashboardComponent,
    ReportsGlobalControlsComponent,
    NetdataDialogComponent,
  ],
  providers: [
    FormatDateTimePipe,
    {
      provide: PlotterService,
      useClass: SmoothPlotterService,
    },
  ],
})
export class ReportsDashboardModule {}
