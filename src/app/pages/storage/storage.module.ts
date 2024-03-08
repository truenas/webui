import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule, FlexModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { NgChartsModule } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFileSizeModule } from 'app/modules/ix-file-size/ix-file-size.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { GaugeChartComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/gauge-chart/gauge-chart.component';
import { PoolUsageCardComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.component';
import { TopologyCardComponent } from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';
import { ImportPoolComponent } from 'app/pages/storage/components/import-pool/import-pool.component';
import { PoolsDashboardComponent } from 'app/pages/storage/components/pools-dashboard/pools-dashboard.component';
import {
  ManageUnusedDiskDialogComponent,
} from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import { UnusedDiskCardComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/unused-disk-card.component';
import { UnusedResourcesComponent } from 'app/pages/storage/components/unused-resources/unused-resources.component';
import { PoolManagerModule } from 'app/pages/storage/modules/pool-manager/pool-manager.module';
import { routing } from 'app/pages/storage/storage.routing';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DashboardPoolComponent } from './components/dashboard-pool/dashboard-pool.component';
import { DiskHealthCardComponent } from './components/dashboard-pool/disk-health-card/disk-health-card.component';
import { ExportDisconnectModalComponent } from './components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { AutotrimDialogComponent } from './components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';
import { ZfsHealthCardComponent } from './components/dashboard-pool/zfs-health-card/zfs-health-card.component';

@NgModule({
  imports: [
    PoolManagerModule,
    routing,
    IxTableModule,
    IxFormsModule,
    TranslateModule,
    MatCardModule,
    MatTooltipModule,
    MatButtonModule,
    RouterModule,
    CommonModule,
    MatPaginatorModule,
    IxIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    NgChartsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    LayoutModule,
    MatFormFieldModule,
    MatOptionModule,
    TooltipModule,
    IxFileSizeModule,
    FlexModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    CastModule,
    MatInputModule,
    CommonDirectivesModule,
    CoreComponents,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
    LayoutModule,
    EntityModule,
    TestIdModule,
    AppLoaderModule,
    EmptyComponent,
  ],
  declarations: [
    PoolsDashboardComponent,
    PoolUsageCardComponent,
    GaugeChartComponent,
    TopologyCardComponent,
    ImportPoolComponent,
    ManageUnusedDiskDialogComponent,
    ZfsHealthCardComponent,
    UnusedDiskCardComponent,
    UnusedResourcesComponent,
    DashboardPoolComponent,
    ExportDisconnectModalComponent,
    DiskHealthCardComponent,
    AutotrimDialogComponent,
    PoolCardIconComponent,
  ],
  providers: [
    FormatDateTimePipe,
    PoolsDashboardStore,
  ],
})
export class StorageModule { }
