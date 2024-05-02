import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DiskOverviewComponent } from 'app/pages/system/enclosure/components/disk-overview/disk-overview.component';
import { EnclosureDashboardComponent } from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
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
  ],
  declarations: [
    EnclosureDashboardComponent,
    DiskOverviewComponent,
    DriveTrayComponent,
    EnclosureOverviewComponent,
    M50EnclosureComponent,
  ],
  providers: [
    EnclosureStore,
  ],
})
export class EnclosureModule {}
