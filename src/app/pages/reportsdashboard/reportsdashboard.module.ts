import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/appMaterial.module';
import { AppCommonModule } from 'app/components/common/app-common.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { LineChartComponent } from './components/lineChart/lineChart.component';
import { ReportComponent } from './components/report/report.component';
import { ReportsConfigComponent } from './components/reports-config/reports-config.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';
import { ReportsDashboardComponent } from './reportsdashboard.component';
import { routing } from './reportsdashboard.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    routing,
    MaterialModule,
    ScrollingModule,
    AppCommonModule,
    TranslateModule,
    EntityModule,
    FlexLayoutModule,
    CommonDirectivesModule,
    EntityModule,
  ],
  declarations: [
    ReportsDashboardComponent,
    ReportsGlobalControlsComponent,
    ReportsConfigComponent,
    ReportComponent,
    LineChartComponent,
  ],
  providers: [

  ],
})
export class ReportsDashboardModule {
}
