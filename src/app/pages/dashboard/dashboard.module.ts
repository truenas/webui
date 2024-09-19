import {
  AsyncPipe, KeyValuePipe, NgClass, NgComponentOutlet, NgTemplateOutlet, PercentPipe, TitleCasePipe,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { Ng2FittextModule } from 'ng2-fittext';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  DisableFocusableElementsDirective,
} from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';
import { NewFeatureIndicatorDirective } from 'app/directives/new-feature-indicator/new-feature-indicator.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxIconGroupComponent } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeader2Component,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header2/ix-modal-header2.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxDropGridModule } from 'app/modules/ix-drop-grid/ix-drop-grid.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
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
import { AppCardInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-card-info/app-card-info.component';
import { AppControlsComponent } from 'app/pages/dashboard/widgets/apps/common/app-controls/app-controls.component';
import { AppCpuInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-cpu-info/app-cpu-info.component';
import { AppMemoryInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-memory-info/app-memory-info.component';
import { AppNetworkInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-network-info/app-network-info.component';
import { AppVersionPipe } from 'app/pages/dashboard/widgets/apps/common/utils/app-version.pipe';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';
import { BackupTaskEmptyComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-empty/backup-task-empty.component';
import { BackupTaskTileComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-tile/backup-task-tile.component';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { DisksWithZfsErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/disks-with-zfs-errors/disks-with-zfs-errors.component';
import { LastScanErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/last-scan-errors/last-scan-errors.component';
import { PoolStatusComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/pool-status/pool-status.component';
import { GaugeChartComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/gauge-chart/gauge-chart.component';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';
import { UptimePipe } from 'app/pages/dashboard/widgets/system/common/uptime.pipe';
import { PoolUsageGaugeComponent } from './widgets/storage/widget-pool/common/pool-usage-gauge/pool-usage-gauge.component';

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
    PoolUsageGaugeComponent,
    DisksWithZfsErrorsComponent,
    PoolStatusComponent,
    LastScanErrorsComponent,
    AppCardInfoComponent,
    AppControlsComponent,
    AppCpuInfoComponent,
    AppMemoryInfoComponent,
    AppNetworkInfoComponent,
    ...widgetComponents,
  ],
  providers: [
    DashboardStore,
    WidgetResourcesService,
  ],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    AppLoaderModule,
    NgComponentOutlet,
    TestIdModule,
    PageHeaderModule,
    routing,
    MatCard,
    IxIconModule,
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
    FormatDateTimePipe,
    FileSizePipe,
    CopyButtonComponent,
    MapValuePipe,
    ViewChartAreaComponent,
    ViewChartGaugeComponent,
    NetworkSpeedPipe,
    IxFieldsetComponent,
    IxSelectComponent,
    FormActionsComponent,
    IxIconGroupComponent,
    IxModalHeader2Component,
    IxInputComponent,
    CopyrightLineComponent,
    TitleCasePipe,
    PercentPipe,
    AsyncPipe,
    NgClass,
    NgTemplateOutlet,
    DisableFocusableElementsDirective,
    NewFeatureIndicatorDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    Ng2FittextModule,
    KeyValuePipe,
    AppCardLogoComponent,
    AppStateCellComponent,
    AppUpdateCellComponent,
    AppVersionPipe,
  ],
})
export class DashboardModule {
}
