import { AppCommonModule } from '../../components/common/app-common.module';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { MaterialModule } from '../../appMaterial.module';

import { ReportComponent } from './components/report/report.component';

import {ReportsDashboardComponent} from './reportsdashboard.component';
import {routing} from './reportsdashboard.routing';
import {LineChartService} from '../../components/common/lineChart/lineChart.service';

@NgModule({
  imports : [ 
    CommonModule, 
    FormsModule, 
    routing, 
    MaterialModule,
    AppCommonModule,
    TranslateModule,
    FlexLayoutModule
  ],
  declarations : [
    ReportsDashboardComponent,
    ReportComponent
  ],
  providers : [
    
  ]
})
export class ReportsDashboardModule {
}
