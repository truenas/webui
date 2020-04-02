import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MaterialModule } from 'app/appMaterial.module';

import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { ViewEnclosureComponent } from './view-enclosure.component';
import { EnclosureDisksComponent } from './enclosure-disks/enclosure-disks.component';
import { EnclosureDisksMiniComponent } from './enclosure-disks/enclosure-disks-mini.component';
import { DiskComponent } from './enclosure-disks/components/disk.component';
import { TabContentComponent } from './enclosure-disks/components/tab-content/tab-content.component';
import { TemperatureMeterComponent } from './enclosure-disks/components/temperature-meter/temperature-meter.component';

@NgModule({
  imports: [
    CommonModule, MaterialModule, TranslateModule, FlexLayoutModule
  ],
  declarations: [
    ViewEnclosureComponent,
    EnclosureDisksComponent,
    EnclosureDisksMiniComponent,
    DiskComponent,
    TabContentComponent,
    TemperatureMeterComponent
  ],
  providers: []
})
export class EnclosureModule {}
