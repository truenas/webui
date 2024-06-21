import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFileSizeModule } from 'app/modules/ix-file-size/ix-file-size.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { EnclosureDiskComponent } from 'app/pages/system/enclosure/components/disk-component/disk.component';
import { EnclosureDashboardComponent } from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import {
  EnclosureHeaderComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import {
  ViewElementsMenuComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/view-elements-menu/view-elements-menu.component';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof-form.component';
import { JbofListComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-list.component';
import {
  ElementsPageComponent,
} from 'app/pages/system/enclosure/components/pages/elements-page/elements-page.component';
import { EnclosurePageComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-page.component';
import { EnclosureSelectorComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-selector/enclosure-selector.component';
import {
  EnclosureSideComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side/enclosure-side.component';
import {
  EnclosureSvgComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side/enclosure-svg/enclosure-svg.component';
import { DiskTopologyDescriptionComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disk-topology-description/disk-topology-description.component';
import { DisksOverviewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disks-overview/disks-overview.component';
import {
  EnclosureSideSwitchComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/enclosure-side-switch/enclosure-side-switch.component';
import {
  EnclosureViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/enclosure-view.component';
import { SasExpanderStatusViewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/sas-expander-status-view/sas-expander-status-view.component';
import { VdevDisksListComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/vdev-disks-list/vdev-disks-list.component';
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
    CommonModule,
    MatCardModule,
    MatButtonModule,
    TranslateModule,
    IxIconModule,
    LayoutModule,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    IxTableModule,
    CommonDirectivesModule,
    SearchInput1Component,
    MatTooltip,
    IxFormsModule,
    ReactiveFormsModule,
    IxFileSizeModule,
    MatDialogClose,
    MatDialogTitle,
    EmptyComponent,
    CoreComponents,
  ],
  declarations: [
    EnclosureDashboardComponent,
    DisksOverviewComponent,
    DiskTopologyDescriptionComponent,
    EnclosureSelectorComponent,
    EnclosurePageComponent,
    JbofListComponent,
    SasExpanderStatusViewComponent,
    JbofFormComponent,
    VdevDisksListComponent,
    SetEnclosureLabelDialogComponent,
    EnclosureDiskComponent,
    ElementsPageComponent,
    EnclosureHeaderComponent,
    ViewElementsMenuComponent,
    EnclosureSvgComponent,
    EnclosureSideSwitchComponent,
    EnclosureViewComponent,
    EnclosureSideComponent,
  ],
  providers: [
    EnclosureStore,
    SvgCacheService,
  ],
})
export class EnclosureModule {}
