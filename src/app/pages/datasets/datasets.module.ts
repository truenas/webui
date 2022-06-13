import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { DatasetDetailsComponent } from 'app/pages/datasets/components/dataset-details/dataset-details.component';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { routing } from 'app/pages/datasets/datasets.routing';
import { PermissionsModule } from 'app/pages/datasets/modules/permissions/permissions.module';

@NgModule({
  imports: [
    CommonModule,
    routing,
    TranslateModule,
    MatIconModule,
    MatCardModule,
    MatRippleModule,
    AppCommonModule,
    PermissionsModule,
    FlexLayoutModule,
    IxTableModule,
    IxFormsModule,
    IxTreeModule,
  ],
  declarations: [
    DatasetsManagementComponent,
    DatasetDetailsComponent,
  ],
})
export class DatasetsModule { }
