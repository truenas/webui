import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule, FlexModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ChartsModule } from 'ng2-charts';
import { NgxFilesizeModule } from 'ngx-filesize';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { GaugeChartComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/gauge-chart/gauge-chart.component';
import { PoolUsageCardComponent } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.component';
import { TopologyCardComponent } from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';
import { ImportPoolComponent } from 'app/pages/storage/components/import-pool/import-pool.component';
import { ExportedPoolsDialogComponent } from 'app/pages/storage/components/manager/exported-pools-dialog/exported-pools-dialog.component';
import { ManagerComponent } from 'app/pages/storage/components/manager/manager.component';
import {
  RepeatVdevDialogComponent,
} from 'app/pages/storage/components/manager/repeat-vdev-dialog/repeat-vdev-dialog.component';
import { VdevComponent } from 'app/pages/storage/components/manager/vdev/vdev.component';
import { PoolsDashboardComponent } from 'app/pages/storage/components/pools-dashboard/pools-dashboard.component';
import {
  ManageUnusedDiskDialogComponent,
} from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import { UnusedDiskCardComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/unused-disk-card.component';
import { UnusedResourcesComponent } from 'app/pages/storage/components/unused-resources/unused-resources.component';
import { routing } from 'app/pages/storage/storage.routing';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DashboardPoolComponent } from './components/dashboard-pool/dashboard-pool.component';
import { DiskHealthCardComponent } from './components/dashboard-pool/disk-health-card/disk-health-card.component';
import { ExportDisconnectModalComponent } from './components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { AutotrimDialogComponent } from './components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';
import { ZfsHealthCardComponent } from './components/dashboard-pool/zfs-health-card/zfs-health-card.component';

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
    MatPaginatorModule,
    IxIconModule,
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
    NgxFilesizeModule,
  ],
  declarations: [
    PoolsDashboardComponent,
    PoolUsageCardComponent,
    GaugeChartComponent,
    TopologyCardComponent,
    ImportPoolComponent,
    VdevComponent,
    ManagerComponent,
    ExportedPoolsDialogComponent,
    ManageUnusedDiskDialogComponent,
    ZfsHealthCardComponent,
    UnusedDiskCardComponent,
    UnusedResourcesComponent,
    DashboardPoolComponent,
    ExportDisconnectModalComponent,
    DiskHealthCardComponent,
    AutotrimDialogComponent,
    RepeatVdevDialogComponent,
    PoolCardIconComponent,
  ],
  providers: [
    FormatDateTimePipe,
    PoolsDashboardStore,
  ],
})
export class StorageModule { }
