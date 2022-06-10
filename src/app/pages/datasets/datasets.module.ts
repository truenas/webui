import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { routing } from 'app/pages/datasets/datasets.routing';

@NgModule({
  imports: [
    routing,
    IxTableModule,
    IxFormsModule,
    TranslateModule,
    MatCardModule,
    AppCommonModule,
  ],
  declarations: [
    DatasetsManagementComponent,
  ],
})
export class DatasetsModule { }
