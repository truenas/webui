import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule, FlexModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ChartsModule } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { ImportPoolComponent } from 'app/pages/storage2/components/import-pool/import-pool.component';
import { ManagerComponent } from 'app/pages/storage2/components/manager/manager.component';
import { VdevComponent } from 'app/pages/storage2/components/manager/vdev/vdev.component';
import { GaugeChartComponent } from 'app/pages/storage2/components/pools-dashboard/pool-usage-card/gauge-chart/gauge-chart.component';
import { PoolUsageCardComponent } from 'app/pages/storage2/components/pools-dashboard/pool-usage-card/pool-usage-card.component';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';
import {
  ManageUnusedDiskDialogComponent,
} from 'app/pages/storage2/components/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import { UnusedDiskCardComponent } from 'app/pages/storage2/components/unused-disk-card/unused-disk-card.component';
import { UnusedResourcesComponent } from 'app/pages/storage2/components/unused-resources/unused-resources.component';
import { routing } from 'app/pages/storage2/storage2.routing';
import { DashboardPoolComponent } from './components/dashboard-pool/dashboard-pool.component';
import { ExportDisconnectModalComponent } from './components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { DiskHealthCardComponent } from './components/disk-health-card/disk-health-card.component';
import { ZfsHealthCardComponent } from './components/zfs-health-card/zfs-health-card.component';

@NgModule({
  imports: [
    routing,
    IxTableModule,
    IxFormsModule,
    TranslateModule,
    MatCardModule,
    MatTooltipModule,
    AppCommonModule,
    MatButtonModule,
    RouterModule,
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    ChartsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    LayoutModule,
    NgxDatatableModule,
    MatFormFieldModule,
    MatOptionModule,
    TooltipModule,
    FormsModule,
    FlexModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    CastModule,
    MatInputModule,
    CommonDirectivesModule,
    CoreComponents,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
    LayoutModule,
    MatDialogModule,
  ],
  declarations: [
    PoolsDashboardComponent,
    PoolUsageCardComponent,
    GaugeChartComponent,
    ImportPoolComponent,
    VdevComponent,
    ManagerComponent,
    ManageUnusedDiskDialogComponent,
    ZfsHealthCardComponent,
    UnusedDiskCardComponent,
    UnusedResourcesComponent,
    DashboardPoolComponent,
    ExportDisconnectModalComponent,
    DiskHealthCardComponent,
  ],
  providers: [
    FormatDateTimePipe,
  ],
})
export class Storage2Module { }
