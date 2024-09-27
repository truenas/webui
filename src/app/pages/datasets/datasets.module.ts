import { CdkTreeNodePadding } from '@angular/cdk/tree';
import { AsyncPipe, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { IxDetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxWarningComponent } from 'app/modules/forms/ix-forms/components/ix-warning/ix-warning.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    BaseChartDirective,
    routing,
    TranslateModule,
    IxIconComponent,
    MatCardModule,
    MatTooltipModule,
    MatSortModule,
    MatSlideToggleModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    PermissionsModule,
    EncryptionModule,
    ReactiveFormsModule,
    TreeModule,
    EntityModule,
    MatDialogModule,
    EntityModule,
    NgxSkeletonLoaderModule,
    SnapshotsModule,
    EmptyComponent,
    SearchInput1Component,
    CdkTreeNodePadding,
    MatButton,
    MatIconButton,
    FileSizePipe,
    CopyButtonComponent,
    OrNotAvailablePipe,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    IxSelectComponent,
    IxFieldsetComponent,
    IxModalHeaderComponent,
    IxChipsComponent,
    IxTextareaComponent,
    IxWarningComponent,
    AsyncPipe,
    PercentPipe,
    IxDetailsHeightDirective,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    IxTableEmptyDirective,
    FakeProgressBarComponent,
    TestDirective,
    PageHeaderComponent,
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
