import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';
import { routing } from 'app/pages/reports-dashboard/reports-dashboard.routing';
import { ReportComponent } from './components/report/report.component';
import { ReportsConfigFormComponent } from './components/reports-config-form/reports-config-form.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';

@NgModule({
  imports: [
    CommonModule,
    CoreComponents,
    ReactiveFormsModule,
    IxFormsModule,
    routing,
    ScrollingModule,
    AppCommonModule,
    MatButtonModule,
    MatToolbarModule,
    TranslateModule,
    EntityModule,
    MatTooltipModule,
    IxIconModule,
    MatMenuModule,
    MatCardModule,
    FlexLayoutModule,
    CommonDirectivesModule,
    LayoutModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    TestIdModule,
  ],
  declarations: [
    LineChartComponent,
    ReportComponent,
    ReportsConfigFormComponent,
    ReportsDashboardComponent,
    ReportsGlobalControlsComponent,
  ],
  providers: [FormatDateTimePipe],
})
export class ReportsDashboardModule {}
