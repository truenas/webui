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
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { ChartsModule } from 'app/modules/charts/charts.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxDropGridModule } from 'app/modules/ix-drop-grid/ix-drop-grid.module';
import { IxFileSizeModule } from 'app/modules/ix-file-size/ix-file-size.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { DashboardFormComponent } from 'app/pages/dashboard/components/dashboard-form/dashboard-form.component';
import { WidgetBackupComponent } from 'app/pages/dashboard/components/widget-backup/widget-backup.component';
import { WidgetControllerComponent } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WidgetCpuComponent } from 'app/pages/dashboard/components/widget-cpu/widget-cpu.component';
import { WidgetHelpComponent } from 'app/pages/dashboard/components/widget-help/widget-help.component';
import { WidgetMemoryComponent } from 'app/pages/dashboard/components/widget-memory/widget-memory.component';
import { WidgetNetworkComponent } from 'app/pages/dashboard/components/widget-network/widget-network.component';
import { WidgetNicComponent } from 'app/pages/dashboard/components/widget-nic/widget-nic.component';
import { WidgetPoolComponent } from 'app/pages/dashboard/components/widget-pool/widget-pool.component';
import { WidgetPoolWrapperComponent } from 'app/pages/dashboard/components/widget-pool-wrapper/widget-pool-wrapper.component';
import { WidgetStorageComponent } from 'app/pages/dashboard/components/widget-storage/widget-storage.component';
import {
  SimpleFailoverBtnComponent,
} from 'app/pages/dashboard/components/widget-sys-info/simple-failover-btn.component';
import { WidgetSysInfoComponent } from 'app/pages/dashboard/components/widget-sys-info/widget-sys-info.component';
import { DashboardStorageStore } from 'app/pages/dashboard/store/dashboard-storage-store.service';
import { DashboardStore } from 'app/pages/dashboard/store/dashboard-store.service';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { routing } from './dashboard.routing';

@NgModule({
  imports: [
    CoreComponents,
    CommonModule,
    CommonDirectivesModule,
    ReactiveFormsModule,
    IxFormsModule,
    routing,
    MatCardModule,
    IxFileSizeModule,
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
    CastModule,
    IxDropGridModule,
    ChartsModule,
    LayoutModule,
    TestIdModule,
    NgxSkeletonLoaderModule,
    ImgFallbackModule,
    IxTable2Module,
    EmptyComponent,
    InterfaceStatusIconComponent,
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
  ],
  providers: [
    ResourcesUsageStore,
    DashboardStorageStore,
    DashboardStore,
    FormatDateTimePipe,
  ],
})
export class DashboardModule {
}
