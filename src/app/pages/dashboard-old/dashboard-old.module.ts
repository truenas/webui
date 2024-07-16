import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxDropGridModule } from 'app/modules/ix-drop-grid/ix-drop-grid.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { UptimePipe } from 'app/pages/dashboard/widgets/system/common/uptime.pipe';
import { DashboardComponent } from 'app/pages/dashboard-old/components/dashboard/dashboard.component';
import { DashboardFormComponent } from 'app/pages/dashboard-old/components/dashboard-form/dashboard-form.component';
import { DragHandleComponent } from 'app/pages/dashboard-old/components/drag-handle/drag-handle.component';
import { WidgetBackupComponent } from 'app/pages/dashboard-old/components/widget-backup/widget-backup.component';
import { WidgetControllerComponent } from 'app/pages/dashboard-old/components/widget-controller/widget-controller.component';
import { WidgetCpuComponent } from 'app/pages/dashboard-old/components/widget-cpu/widget-cpu.component';
import { WidgetHelpComponent } from 'app/pages/dashboard-old/components/widget-help/widget-help.component';
import { WidgetMemoryComponent } from 'app/pages/dashboard-old/components/widget-memory/widget-memory.component';
import { WidgetNetworkComponent } from 'app/pages/dashboard-old/components/widget-network/widget-network.component';
import { WidgetNicComponent } from 'app/pages/dashboard-old/components/widget-nic/widget-nic.component';
import { WidgetPoolComponent } from 'app/pages/dashboard-old/components/widget-pool/widget-pool.component';
import { WidgetPoolWrapperComponent } from 'app/pages/dashboard-old/components/widget-pool-wrapper/widget-pool-wrapper.component';
import { WidgetStorageComponent } from 'app/pages/dashboard-old/components/widget-storage/widget-storage.component';
import { SimpleFailoverBtnComponent } from 'app/pages/dashboard-old/components/widget-sys-info/simple-failover-btn.component';
import { WidgetSysInfoComponent } from 'app/pages/dashboard-old/components/widget-sys-info/widget-sys-info.component';
import { routing } from 'app/pages/dashboard-old/dashboard-old.routing';
import { DashboardStorageStore } from 'app/pages/dashboard-old/store/dashboard-storage-store.service';
import { DashboardStore } from 'app/pages/dashboard-old/store/dashboard-store.service';
import { ResourcesUsageStore } from 'app/pages/dashboard-old/store/resources-usage-store.service';

@NgModule({
  imports: [
    CommonModule,
    CommonDirectivesModule,
    ReactiveFormsModule,
    IxFormsModule,
    routing,
    MatCardModule,
    IxIconModule,
    MatMenuModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatGridListModule,
    MatToolbarModule,
    EntityModule,
    TranslateModule,
    IxDropGridModule,
    LayoutModule,
    TestIdModule,
    NgxSkeletonLoaderModule,
    ImgFallbackModule,
    IxTableModule,
    EmptyComponent,
    InterfaceStatusIconComponent,
    UptimePipe,
    FileSizePipe,
    FormatDateTimePipe,
    CopyButtonComponent,
    ViewChartAreaComponent,
    ViewChartGaugeComponent,
    NetworkSpeedPipe,
  ],
  declarations: [
    DashboardComponent,
    DashboardFormComponent,
    WidgetSysInfoComponent,
    WidgetNicComponent,
    WidgetPoolWrapperComponent,
    WidgetCpuComponent,
    WidgetBackupComponent,
    WidgetMemoryComponent,
    WidgetHelpComponent,
    WidgetPoolComponent,
    WidgetControllerComponent,
    WidgetNetworkComponent,
    WidgetStorageComponent,
    SimpleFailoverBtnComponent,
    DragHandleComponent,
  ],
  providers: [
    ResourcesUsageStore,
    DashboardStorageStore,
    DashboardStore,
    FormatDateTimePipe,
  ],
})
export class DashboardOldModule {
}
