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
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { IxWarningComponent } from 'app/modules/forms/ix-forms/components/ix-warning/ix-warning.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
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
    BaseChartDirective,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatDialogModule,
    MatInputModule,
    CommonDirectivesModule,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
    EntityModule,
    TestIdModule,
    AppLoaderModule,
    EmptyComponent,
    FileSizePipe,
    FormatDateTimePipe,
    MapValuePipe,
    FormActionsComponent,
    IxCheckboxComponent,
    IxWarningComponent,
    IxFieldsetComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    IxModalHeaderComponent,
    IxInputComponent,
    PageHeaderModule,
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
