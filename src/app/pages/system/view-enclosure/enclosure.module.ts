import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { DiskComponent } from 'app/pages/system/view-enclosure/enclosure-disks/components/disk-component/disk.component';
import { TabContentComponent } from './enclosure-disks/components/tab-content/tab-content.component';
import { TemperatureMeterComponent } from './enclosure-disks/components/temperature-meter/temperature-meter.component';
import { EnclosureDisksMiniComponent } from './enclosure-disks/enclosure-disks-mini.component';
import { EnclosureDisksComponent } from './enclosure-disks/enclosure-disks.component';
import { ViewEnclosureComponent } from './view-enclosure.component';

@NgModule({
  imports: [
    CommonModule, MaterialModule, TranslateModule, FlexLayoutModule, EntityModule, TooltipModule,
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
