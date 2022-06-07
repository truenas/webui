import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { DiskComponent } from 'app/pages/system/view-enclosure/components/disk-component/disk.component';
import { EnclosureDisksMiniComponent } from 'app/pages/system/view-enclosure/components/enclosure-disks-mini/enclosure-disks-mini.component';
import { EnclosureDisksComponent } from 'app/pages/system/view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { ViewEnclosureComponent } from 'app/pages/system/view-enclosure/components/view-enclosure/view-enclosure.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';
import { TemperatureMeterComponent } from './components/temperature-meter/temperature-meter.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FlexLayoutModule,
    EntityModule,
    TooltipModule,
    CastModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
  ],
  declarations: [
    ViewEnclosureComponent,
    EnclosureDisksComponent,
    EnclosureDisksMiniComponent,
    DiskComponent,
    TabContentComponent,
    TemperatureMeterComponent,
  ],
  providers: [],
})
export class EnclosureModule {}
