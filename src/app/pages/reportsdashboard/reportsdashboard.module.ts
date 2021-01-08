import { AppCommonModule } from '../../components/common/app-common.module';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { MaterialModule } from '../../appMaterial.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';

import { ScrollingModule } from '@angular/cdk/scrolling'; 
import { ReportComponent } from './components/report/report.component';
import { ReportsConfigComponent } from './components/reports-config/reports-config.component'
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';

import { ReportsDashboardComponent } from './reportsdashboard.component';
import { routing } from './reportsdashboard.routing';
import { LineChartComponent } from './components/lineChart/lineChart.component';

@NgModule({
  imports : [ 
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
    EntityModule
  ],
  declarations : [
    ReportsDashboardComponent,
    ReportsGlobalControlsComponent,
    ReportsConfigComponent,
    ReportComponent,
    LineChartComponent,
  ],
  providers : [
    
  ]
})
export class ReportsDashboardModule {
}
