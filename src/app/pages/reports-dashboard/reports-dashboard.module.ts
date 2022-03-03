import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/components/common/app-common.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { LineChartComponent } from 'app/pages/reports-dashboard/components/line-chart/line-chart.component';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';
import { routing } from 'app/pages/reports-dashboard/reports-dashboard.routing';
import { ReportComponent } from './components/report/report.component';
import { ReportsConfigFormComponent } from './components/reports-config-form/reports-config-form.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IxFormsModule,
    routing,
    ScrollingModule,
    AppCommonModule,
    TranslateModule,
    EntityModule,
    MatTooltipModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    FlexLayoutModule,
    CommonDirectivesModule,
    EntityModule,
  ],
  declarations: [
    LineChartComponent,
    ReportComponent,
    ReportsConfigFormComponent,
    ReportsDashboardComponent,
    ReportsGlobalControlsComponent,
  ],
  providers: [

  ],
  exports: [

  ],
})
export class ReportsDashboardModule {
}
