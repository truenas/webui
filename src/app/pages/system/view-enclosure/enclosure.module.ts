import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
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
    CommonModule, MaterialModule, TranslateModule, FlexLayoutModule, EntityModule, TooltipModule, CastModule,
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
