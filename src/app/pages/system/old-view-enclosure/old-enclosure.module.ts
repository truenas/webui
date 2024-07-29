import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { DiskComponent } from 'app/pages/system/old-view-enclosure/components/disk-component/disk.component';
import { EnclosureDisksComponent } from 'app/pages/system/old-view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { EnclosureDisksMiniComponent } from 'app/pages/system/old-view-enclosure/components/enclosure-disks-mini/enclosure-disks-mini.component';
import { JbosFormComponent } from 'app/pages/system/old-view-enclosure/components/jbof-form/jbof-form.component';
import { JbofListComponent } from 'app/pages/system/old-view-enclosure/components/jbof-list/jbof-list.component';
import { ViewEnclosureComponent } from 'app/pages/system/old-view-enclosure/components/view-enclosure/view-enclosure.component';
import { routing } from 'app/pages/system/system.routing';
import { SetEnclosureLabelDialogComponent } from './components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';
import { TemperatureMeterComponent } from './components/temperature-meter/temperature-meter.component';
import { EnclosureStore } from './stores/enclosure-store.service';

@NgModule({
  imports: [
    routing,
    CommonModule,
    TranslateModule,
    FlexLayoutModule,
    EntityModule,
    IxIconModule,
    PageHeaderModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    LayoutModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    ReactiveFormsModule,
    IxFormsModule,
    TestIdModule,
    CommonDirectivesModule,
    IxTableModule,
    SearchInput1Component,
    FileSizePipe,
    TooltipComponent,
  ],
  declarations: [
    ViewEnclosureComponent,
    EnclosureDisksComponent,
    EnclosureDisksMiniComponent,
    DiskComponent,
    TabContentComponent,
    TemperatureMeterComponent,
    SetEnclosureLabelDialogComponent,
    JbofListComponent,
    JbosFormComponent,
  ],
  providers: [EnclosureStore],
})
export class OldEnclosureModule {}
