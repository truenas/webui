import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { DiskComponent } from 'app/pages/system/view-enclosure/components/disk-component/disk.component';
import { EnclosureDisksComponent } from 'app/pages/system/view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { EnclosureDisksMiniComponent } from 'app/pages/system/view-enclosure/components/enclosure-disks-mini/enclosure-disks-mini.component';
import { ViewEnclosureComponent } from 'app/pages/system/view-enclosure/components/view-enclosure/view-enclosure.component';
import { SetEnclosureLabelDialogComponent } from './components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';
import { TemperatureMeterComponent } from './components/temperature-meter/temperature-meter.component';
import { EnclosureStore } from './stores/enclosure-store.service';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FlexLayoutModule,
    EntityModule,
    TooltipModule,
    CastModule,
    IxIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    LayoutModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    ReactiveFormsModule,
    IxFormsModule,
    CoreComponents,
    TestIdModule,
    NgxFilesizeModule,
  ],
  declarations: [
    ViewEnclosureComponent,
    EnclosureDisksComponent,
    EnclosureDisksMiniComponent,
    DiskComponent,
    TabContentComponent,
    TemperatureMeterComponent,
    SetEnclosureLabelDialogComponent,
  ],
  providers: [EnclosureStore],
})
export class EnclosureModule {}
