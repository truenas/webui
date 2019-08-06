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
    CommonDirectivesModule
  ],
  declarations : [
    ReportsDashboardComponent,
    ReportComponent,
    LineChartComponent
  ],
  providers : [
    
  ]
})
export class ReportsDashboardModule {
}
