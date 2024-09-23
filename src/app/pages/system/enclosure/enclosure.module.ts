import { AsyncPipe, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { EnclosureDashboardComponent } from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import {
  EnclosureHeaderComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import {
  ViewElementsMenuComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/view-elements-menu/view-elements-menu.component';
import {
  EnclosureSideComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import {
  EnclosureSvgComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import {
  NotSupportedModelComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/not-supported-model/not-supported-model.component';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof-form.component';
import { JbofListComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-list.component';
import {
  ElementsPageComponent,
} from 'app/pages/system/enclosure/components/pages/elements-page/elements-page.component';
import {
  DiskDetailsOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/disk-details-overview/disk-details-overview.component';
import { DiskDetailsComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/disk-details-overview/disks-overview-details/disk-details.component';
import { DisksOverviewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/disks-overview/disks-overview.component';
import { EnclosurePageComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-page.component';
import { EnclosureSelectorComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-selector/enclosure-selector.component';
import {
  EnclosureSideSwitchComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side-switch/enclosure-side-switch.component';
import { DiskTopologyDescriptionComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/disk-topology-description/disk-topology-description.component';
import {
  PoolsViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/pools-view.component';
import {
  VdevDisksLegendComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/vdev-disks-legend/vdev-disks-legend.component';
import { SasExpanderStatusViewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/sas-expander-status-view/sas-expander-status-view.component';
import {
  StatusViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/status-view/status-view.component';
import {
  StatusesLegendComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/status-view/statuses-legend/statuses-legend.component';
import {
  MiniDisksOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-disks-overview/mini-disks-overview.component';
import {
  MiniDriveDetailsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-details/mini-drive-details.component';
import {
  MiniDriveStatsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-stats/mini-drive-stats.component';
import {
  MiniDriveTemperaturesComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-temperatures/mini-drive-temperatures.component';
import {
  MiniEnclosureComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-enclosure/mini-enclosure.component';
import {
  MiniSlotStatusComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-enclosure/mini-slot-status/mini-slot-status.component';
import { MiniPageComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-page.component';
import {
  MiniPoolsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-pools/mini-pools.component';
import {
  PoolsLegendComponent,
} from 'app/pages/system/enclosure/components/pools-legend/pools-legend.component';
import {
  SetEnclosureLabelDialogComponent,
} from 'app/pages/system/enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { routing } from 'app/pages/system/enclosure/enclosure.routing';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { SvgCacheService } from 'app/pages/system/enclosure/services/svg-cache.service';

@NgModule({
  imports: [
    routing,
    TestIdModule,
    MatCardModule,
    MatButtonModule,
    TranslateModule,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    SearchInput1Component,
    MatTooltip,
    ReactiveFormsModule,
    MatDialogClose,
    MatDialogTitle,
    EmptyComponent,
    FileSizePipe,
    MapValuePipe,
    NgxSkeletonLoaderModule,
    AppLoaderModule,
    DiskIconComponent,
    TooltipComponent,
    OrNotAvailablePipe,
    IxInputComponent,
    FormActionsComponent,
    IxCheckboxComponent,
    IxFieldsetComponent,
    IxModalHeaderComponent,
    PageHeaderModule,
    DecimalPipe,
    AsyncPipe,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableEmptyDirective,
    IxTablePagerComponent,
  ],
  declarations: [
    EnclosureDashboardComponent,
    DisksOverviewComponent,
    DiskDetailsComponent,
    DiskTopologyDescriptionComponent,
    EnclosureSelectorComponent,
    EnclosurePageComponent,
    JbofListComponent,
    SasExpanderStatusViewComponent,
    JbofFormComponent,
    VdevDisksLegendComponent,
    SetEnclosureLabelDialogComponent,
    ElementsPageComponent,
    EnclosureHeaderComponent,
    ViewElementsMenuComponent,
    EnclosureSvgComponent,
    EnclosureSideSwitchComponent,
    PoolsViewComponent,
    EnclosureSideComponent,
    MiniPageComponent,
    MiniDisksOverviewComponent,
    MiniDriveDetailsComponent,
    MiniDriveStatsComponent,
    MiniDriveTemperaturesComponent,
    MiniPoolsComponent,
    MiniEnclosureComponent,
    MiniSlotStatusComponent,
    PoolsLegendComponent,
    StatusViewComponent,
    StatusesLegendComponent,
    DiskDetailsOverviewComponent,
    NotSupportedModelComponent,
    IdentifyLightComponent,
  ],
  providers: [
    EnclosureStore,
    SvgCacheService,
  ],
})
export class EnclosureModule {}
