import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
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
  SetEnclosureLabelDialogComponent,
} from 'app/pages/system/enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import {
  ElementsComponent,
} from 'app/pages/system/enclosure/components/views/elements-view/elements.component';
import { DisksOverviewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/disks-overview/disks-overview.component';
import { IxEnclosureSelectorComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosure-selector/enclosure-selector.component';
import { EnclosureViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosure-view.component';
import { DiskTopologyDescriptionComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/disk-topology-description/disk-topology-description.component';
import { EnclosureViewDirective } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/enclosure-view/enclosure-view.directive';
import { MSeriesFrontViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/mseries-enclosure/mseries-front-view/mseries-front-view.component';
import { MSeriesRearViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/mseries-enclosure/mseries-rear-view/mseries-rear-view.component';
import { SasExpanderStatusViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/sas-expander-status-view/sas-expander-status-view.component';
import { VdevDisksListComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/vdev-disks-list/vdev-disks-list.component';
import { routing } from 'app/pages/system/enclosure/enclosure.routing';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

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
  ],
  declarations: [
    EnclosureDashboardComponent,
    DisksOverviewComponent,
    DiskTopologyDescriptionComponent,
    IxEnclosureSelectorComponent,
    EnclosureViewComponent,
    MSeriesFrontViewComponent,
    MSeriesRearViewComponent,
    EnclosureViewDirective,
    JbofListComponent,
    SasExpanderStatusViewComponent,
    JbofFormComponent,
    VdevDisksListComponent,
    SetEnclosureLabelDialogComponent,
    EnclosureDiskComponent,
    ElementsComponent,
    EnclosureHeaderComponent,
    ViewElementsMenuComponent,
  ],
  providers: [
    EnclosureStore,
  ],
})
export class EnclosureModule {}
