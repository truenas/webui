import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { DiskInfoCardComponent } from 'app/pages/storage2/components/disk-info-card/disk-info-card.component';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';
import { routing } from 'app/pages/storage2/storage2.routing';

@NgModule({
  imports: [
    routing,
    IxTableModule,
    IxFormsModule,
    TranslateModule,
    MatCardModule,
    MatListModule,
    AppCommonModule,
    MatButtonModule,
    RouterModule,
  ],
  declarations: [
    PoolsDashboardComponent,
    DiskInfoCardComponent,
  ],
})
export class Storage2Module { }
