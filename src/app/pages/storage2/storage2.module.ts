import { NgModule } from '@angular/core';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { DatasetManagementComponent } from 'app/pages/storage2/components/dataset-management/dataset-management.component';
import { DeviceManagementComponent } from 'app/pages/storage2/components/device-management/device-management.component';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';
import { routing } from 'app/pages/storage2/storage2.routing';

@NgModule({
  imports: [
    routing,
    IxFormsModule,
  ],
  declarations: [
    DatasetManagementComponent,
    DeviceManagementComponent,
    PoolsDashboardComponent,
  ],
})
export class Storage2Module { }
