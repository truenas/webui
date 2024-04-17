import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DiskOverviewComponent } from 'app/pages/system/enclosure/components/disk-overview/disk-overview.component';
import { EnclosureDashboardComponent } from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import { EnclosureOverviewComponent } from 'app/pages/system/enclosure/components/enclosure-overview/enclosure-overview.component';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/enclosures/m50-enclosure/m50-enclosure.component';
import { routing } from 'app/pages/system/system.routing';

@NgModule({
  imports: [
    routing,
    TestIdModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
  ],
  declarations: [
    EnclosureDashboardComponent,
    DiskOverviewComponent,
    EnclosureOverviewComponent,
    M50EnclosureComponent,
  ],

})
export class EnclosureModule {}
