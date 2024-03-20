import { CdkTreeNodePadding } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { NgChartsModule } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFileSizeModule } from 'app/modules/ix-file-size/ix-file-size.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DataProtectionCardComponent } from 'app/pages/datasets/components/data-protection-card/data-protection-card.component';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { NameAndOptionsSectionComponent } from 'app/pages/datasets/components/dataset-form/sections/name-and-options-section/name-and-options-section.component';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetRolesCellComponent } from 'app/pages/datasets/components/dataset-node/dataset-roles-cell/dataset-roles-cell.component';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { DatasetQuotasListComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-list/dataset-quotas-list.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { RolesCardComponent } from 'app/pages/datasets/components/roles-card/roles-card.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { routing } from 'app/pages/datasets/datasets.routing';
import { EncryptionModule } from 'app/pages/datasets/modules/encryption/encryption.module';
import { PermissionsModule } from 'app/pages/datasets/modules/permissions/permissions.module';
import { SnapshotsModule } from 'app/pages/datasets/modules/snapshots/snapshots.module';
import { DatasetCapacityManagementCardComponent } from './components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetCapacitySettingsComponent } from './components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { SpaceManagementChartComponent } from './components/dataset-capacity-management-card/space-management-chart/space-management-chart.component';
import { EncryptionSectionComponent } from './components/dataset-form/sections/encryption-section/encryption-section.component';
import { OtherOptionsSectionComponent } from './components/dataset-form/sections/other-options-section/other-options-section.component';
import { QuotasSectionComponent } from './components/dataset-form/sections/quotas-section/quotas-section.component';
import { DatasetIconComponent } from './components/dataset-icon/dataset-icon.component';
import { DatasetEncryptionCellComponent } from './components/dataset-node/dataset-encryption-cell/dataset-encryption-cell.component';
import { DatasetNodeComponent } from './components/dataset-node/dataset-node.component';

@NgModule({
  imports: [
    CommonModule,
    CommonDirectivesModule,
    NgChartsModule,
    LayoutModule,
    routing,
    TranslateModule,
    IxIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSortModule,
    MatSlideToggleModule,
    IxFileSizeModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    PermissionsModule,
    EncryptionModule,
    FlexLayoutModule,
    IxTableModule,
    ReactiveFormsModule,
    IxFormsModule,
    TreeModule,
    IxTableModule,
    EntityModule,
    MatDialogModule,
    EntityModule,
    NgxSkeletonLoaderModule,
    CoreComponents,
    AppLoaderModule,
    SnapshotsModule,
    TestIdModule,
    EmptyComponent,
    SearchInput1Component,
    CdkTreeNodePadding,
    IxTable2Module,
  ],
  declarations: [
    DatasetsManagementComponent,
    DatasetDetailsCardComponent,
    DatasetFormComponent,
    DeleteDatasetDialogComponent,
    DatasetDetailsPanelComponent,
    DataProtectionCardComponent,
    DatasetCapacityManagementCardComponent,
    DatasetNodeComponent,
    RolesCardComponent,
    DatasetQuotaAddFormComponent,
    DatasetQuotaEditFormComponent,
    DatasetQuotasListComponent,
    DatasetIconComponent,
    DatasetRolesCellComponent,
    DatasetEncryptionCellComponent,
    ZvolFormComponent,
    SpaceManagementChartComponent,
    DatasetCapacitySettingsComponent,
    NameAndOptionsSectionComponent,
    EncryptionSectionComponent,
    QuotasSectionComponent,
    OtherOptionsSectionComponent,
  ],
  providers: [],
})
export class DatasetsModule { }
