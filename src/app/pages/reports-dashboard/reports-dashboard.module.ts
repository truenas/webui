import { ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe, KeyValuePipe, NgTemplateOutlet } from '@angular/common';
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
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/forms/ix-dynamic-form/ix-dynamic-form.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { IxDateComponent } from 'app/modules/pipes/ix-date/ix-date.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    ReactiveFormsModule,
    IxDynamicFormModule,
    routing,
    ScrollingModule,
    MatButtonModule,
    IxDateComponent,
    MatToolbarModule,
    TranslateModule,
    EntityModule,
    MatTooltipModule,
    IxIconComponent,
    MatMenuModule,
    MatCardModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatDialogModule,
    EmptyComponent,
    SearchInput1Component,
    MapValuePipe,
    IxFieldsetComponent,
    IxModalHeaderComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    IxSlideToggleComponent,
    AsyncPipe,
    KeyValuePipe,
    NgTemplateOutlet,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    FakeProgressBarComponent,
    TestDirective,
    PageHeaderComponent,
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
