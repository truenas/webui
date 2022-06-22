import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';
import { routing } from 'app/pages/storage2/storage2.routing';
import { ZfsHealthCardComponent } from './components/zfs-health-card/zfs-health-card.component';

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
    CoreComponents,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
    MatIconModule,
  ],
  declarations: [
    PoolsDashboardComponent,
    ZfsHealthCardComponent,
  ],
  providers: [
    FormatDateTimePipe,
  ],
})
export class Storage2Module { }
