import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { DatasetQuotasGrouplistComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-grouplist/dataset-quotas-grouplist.component';
import { DatasetQuotasUserlistComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-userlist/dataset-quotas-userlist.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { LoadingCardContentComponent } from 'app/pages/datasets/components/loading-card-content/loading-card-content.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { routing } from 'app/pages/datasets/datasets.routing';
import { EncryptionModule } from 'app/pages/datasets/modules/encryption/encryption.module';
import { PermissionsModule } from 'app/pages/datasets/modules/permissions/permissions.module';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { DatasetCapacityManagementCardComponent } from './components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetIconComponent } from './components/dataset-icon/dataset-icon.component';
import { DatasetEncryptionCellComponent } from './components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';
import { DatasetNodeComponent } from './components/dataset-node/dataset-node.component';

@NgModule({
  imports: [
    CommonModule,
    CommonDirectivesModule,
    LayoutModule,
    routing,
    TranslateModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSortModule,
    MatSlideToggleModule,
    MatRippleModule,
    AppCommonModule,
    PermissionsModule,
    EncryptionModule,
    FlexLayoutModule,
    IxTableModule,
    ReactiveFormsModule,
    IxFormsModule,
    IxTreeModule,
    IxTableModule,
    MatDialogModule,
    EntityModule,
    MatDialogModule,
    ReactiveFormsModule,
    EntityModule,
    NgxSkeletonLoaderModule,
    NgxFilesizeModule,
    AppLoaderModule,
  ],
  declarations: [
    DatasetsManagementComponent,
    LoadingCardContentComponent,
    DatasetDetailsCardComponent,
    DatasetFormComponent,
    DeleteDatasetDialogComponent,
    DatasetDetailsPanelComponent,
    DatasetCapacityManagementCardComponent,
    DatasetNodeComponent,
    DatasetQuotaAddFormComponent,
    DatasetQuotaEditFormComponent,
    DatasetQuotasUserlistComponent,
    DatasetQuotasGrouplistComponent,
    DatasetIconComponent,
    DatasetEncryptionCellComponent,
    ZvolFormComponent,
  ],
  providers: [
    DatasetTreeStore,
  ],
})
export class DatasetsModule { }
