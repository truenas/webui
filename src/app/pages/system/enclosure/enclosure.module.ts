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
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
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
import { EnclosureViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosure-view.component';
import { DriveTrayComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/drive-tray/drive-tray.component';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/m50-enclosure/m50-enclosure.component';
import { routing } from 'app/pages/system/enclosure/enclosure.routing';

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
    MatDialogClose,
    MatDialogTitle,
    EmptyComponent,
  ],
  declarations: [
    EnclosureDashboardComponent,
    DisksOverviewComponent,
    DriveTrayComponent,
    EnclosureViewComponent,
    M50EnclosureComponent,
    JbofListComponent,
    JbofFormComponent,
    SetEnclosureLabelDialogComponent,
    ElementsComponent,
    EnclosureHeaderComponent,
    ViewElementsMenuComponent,
  ],
})
export class EnclosureModule {}
