import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChartsModule } from 'ng2-charts';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';
import { GaugeChartComponent } from 'app/pages/storage2/components/pools-dashboard/widget-usage/gauge-chart/gauge-chart.component';
import { WidgetUsageComponent } from 'app/pages/storage2/components/pools-dashboard/widget-usage/widget-usage.component';
import { routing } from 'app/pages/storage2/storage2.routing';

@NgModule({
  imports: [
    routing,
    IxTableModule,
    IxFormsModule,
    TranslateModule,
    MatCardModule,
    AppCommonModule,
    MatButtonModule,
    RouterModule,
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    ChartsModule,
    FlexLayoutModule,
  ],
  declarations: [
    PoolsDashboardComponent,
    WidgetUsageComponent,
    GaugeChartComponent,
  ],
})
export class Storage2Module { }
