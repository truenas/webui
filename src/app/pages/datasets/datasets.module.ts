import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { LoadingCardContentComponent } from 'app/pages/datasets/components/loading-card-content/loading-card-content.component';
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
    NgxSkeletonLoaderModule,
    AppCommonModule,
    PermissionsModule,
    FlexLayoutModule,
    IxTableModule,
    ReactiveFormsModule,
    IxFormsModule,
    IxTreeModule,
    MatDialogModule,
    EntityModule,
  ],
  declarations: [
    DatasetsManagementComponent,
    LoadingCardContentComponent,
    DatasetDetailsCardComponent,
    DatasetFormComponent,
    DeleteDatasetDialogComponent,
    DatasetDetailsPanelComponent,
  ],
})
export class DatasetsModule { }
