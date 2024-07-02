import { CommonModule, NgComponentOutlet } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxDropGridModule } from 'app/modules/ix-drop-grid/ix-drop-grid.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { IxFileSizePipe } from 'app/modules/pipes/ix-file-size/ix-file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import {
  WidgetGroupControlsComponent,
} from 'app/pages/dashboard/components/dashboard/widget-group-controls/widget-group-controls.component';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';
import {
  WidgetEditorGroupComponent,
} from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { WidgetGroupSlotFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-slot-form/widget-group-slot-form.component';
import { routing } from 'app/pages/dashboard/dashboard.routing';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { widgetComponents } from 'app/pages/dashboard/widgets/all-widgets.constant';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';
import { BackupTaskEmptyComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-empty/backup-task-empty.component';
import { BackupTaskTileComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-tile/backup-task-tile.component';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { GaugeChartComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/gauge-chart/gauge-chart.component';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';
import { UptimePipe } from 'app/pages/dashboard/widgets/system/common/uptime.pipe';

@NgModule({
  declarations: [
    DashboardComponent,
    ProductImageComponent,
    NetworkChartComponent,
    CpuChartGaugeComponent,
    CpuCoreBarComponent,
    WidgetGroupComponent,
    WidgetErrorComponent,
    WidgetGroupFormComponent,
    WidgetGroupSlotFormComponent,
    WidgetEditorGroupComponent,
    WidgetDatapointComponent,
    WidgetGroupControlsComponent,
    BackupTaskEmptyComponent,
    BackupTaskActionsComponent,
    BackupTaskTileComponent,
    GaugeChartComponent,
    ...widgetComponents,
  ],
  providers: [
    DashboardStore,
    WidgetResourcesService,
  ],
  imports: [
    IxFormsModule,
    ReactiveFormsModule,
    TranslateModule,
    AppLoaderModule,
    NgComponentOutlet,
    CommonDirectivesModule,
    LayoutModule,
    TestIdModule,
    PageHeaderModule,
    routing,
    MatCard,
    IxIconModule,
    CommonModule,
    MatTooltipModule,
    BaseChartDirective,
    MatButtonModule,
    MatCardContent,
    MatGridListModule,
    NgxSkeletonLoaderModule.forRoot({
      animation: false,
      theme: {
        extendsFromRoot: true,
        'margin-bottom': 0,
        background: 'var(--alt-bg1)',
        opacity: '0.25',
      },
    }),
    IxDropGridModule,
    MatListModule,
    EmptyComponent,
    ImgFallbackModule,
    InterfaceStatusIconComponent,
    UptimePipe,
    AppCardLogoComponent,
    AppStatusCellComponent,
    AppUpdateCellComponent,
    FormatDateTimePipe,
    IxFileSizePipe,
    CopyButtonComponent,
    MapValuePipe,
    ViewChartAreaComponent,
    ViewChartGaugeComponent,
  ],
})
export class DashboardModule {
}
