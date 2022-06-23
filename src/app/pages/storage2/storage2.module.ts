import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';
import { UnassignedDiskComponent } from 'app/pages/storage2/components/unassigned-disk/unassigned-disk.component';
import { routing } from 'app/pages/storage2/storage2.routing';

@NgModule({
  imports: [
    routing,
    IxTableModule,
    IxFormsModule,
    TranslateModule,
    MatCardModule,
    MatTooltipModule,
    AppCommonModule,
    MatButtonModule,
    RouterModule,
    LayoutModule,
  ],
  declarations: [
    PoolsDashboardComponent,
    UnassignedDiskComponent,
  ],
})
export class Storage2Module { }
