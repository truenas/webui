import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFileSizeModule } from 'app/modules/ix-file-size/ix-file-size.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { EnclosureDiskComponent } from 'app/pages/system/enclosure/components/disk-component/disk.component';
import { DiskOverviewComponent } from 'app/pages/system/enclosure/components/disk-overview/disk-overview.component';
import { EnclosureDashboardComponent } from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/enclosure-dashboard/jbof-list/jbof-form/jbof-form.component';
import { JbofListComponent } from 'app/pages/system/enclosure/components/enclosure-dashboard/jbof-list/jbof-list.component';
import {
  SetEnclosureLabelDialogComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { EnclosureOverviewComponent } from 'app/pages/system/enclosure/components/enclosure-overview/enclosure-overview.component';
import { DriveTrayComponent } from 'app/pages/system/enclosure/components/enclosures/drive-tray/drive-tray.component';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/enclosures/m50-enclosure/m50-enclosure.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { routing } from 'app/pages/system/system.routing';

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
  ],
  declarations: [
    EnclosureDashboardComponent,
    DiskOverviewComponent,
    DriveTrayComponent,
    EnclosureOverviewComponent,
    M50EnclosureComponent,
    JbofListComponent,
    JbofFormComponent,
    SetEnclosureLabelDialogComponent,
    EnclosureDiskComponent,
  ],
  providers: [
    EnclosureStore,
  ],
})
export class EnclosureModule {}
