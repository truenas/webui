import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatColumnDef } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { MarkdownModule } from 'ngx-markdown';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/forms/ix-dynamic-form/ix-dynamic-form.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import {
  IxCheckboxListComponent,
} from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppsRoutingModule } from 'app/pages/apps/apps-routing.module';
import {
  AppDetailsHeaderComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import {
  AppDetailsSimilarComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-similar/app-details-similar.component';
import { AppWizardComponent } from 'app/pages/apps/components/app-wizard/app-wizard.component';
import { AppsScopeWrapperComponent } from 'app/pages/apps/components/apps-scope-wrapper.component';
import { CatalogSettingsComponent } from 'app/pages/apps/components/catalog-settings/catalog-settings.component';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImagesListComponent } from 'app/pages/apps/components/docker-images/docker-images-list/docker-images-list.component';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { DockerHubRateInfoDialogComponent } from 'app/pages/apps/components/dockerhub-rate-limit-info-dialog/dockerhub-rate-limit-info-dialog.component';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppNotesCardComponent } from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-card.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { AppWorkloadsCardComponent } from 'app/pages/apps/components/installed-apps/app-workloads-card/app-workloads-card.component';
import { VolumeMountsDialogComponent } from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';
import { ContainerLogsComponent } from 'app/pages/apps/components/installed-apps/container-logs/container-logs.component';
import { ContainerShellComponent } from 'app/pages/apps/components/installed-apps/container-shell/container-shell.component';
import { LogsDetailsDialogComponent } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { ShellDetailsDialogComponent } from 'app/pages/apps/components/shell-details-dialog/shell-details-dialog.component';
import { CustomFormsModule } from 'app/pages/apps/modules/custom-forms/custom-forms.module';
import { AppCardLogoComponent } from './components/app-card-logo/app-card-logo.component';
import { AppAvailableInfoCardComponent } from './components/app-detail-view/app-available-info-card/app-available-info-card.component';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppResourcesCardComponent } from './components/app-detail-view/app-resources-card/app-resources-card.component';
import { AppRouterOutletComponent } from './components/app-router-outlet/app-router-outlet.component';
import { AppSectionExpandCollapseComponent } from './components/app-section-expand-collapse/app-section-expand-collapse.component';
import { AppCardComponent } from './components/available-apps/app-card/app-card.component';
import { AvailableAppsHeaderComponent } from './components/available-apps/available-apps-header/available-apps-header.component';
import { AvailableAppsComponent } from './components/available-apps/available-apps.component';
import { CategoryViewComponent } from './components/available-apps/category-view/category-view.component';
import { CustomAppButtonComponent } from './components/available-apps/custom-app-button/custom-app-button.component';
import { AppDetailsPanelComponent } from './components/installed-apps/app-details-panel/app-details-panel.component';
import { AppMetadataCardComponent } from './components/installed-apps/app-metadata-card/app-metadata-card.component';
import { AppUpgradeDialogComponent } from './components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { DockerStatusComponent } from './components/installed-apps/docker-status/docker-status.component';
import { InstalledAppsComponent } from './components/installed-apps/installed-apps.component';

@NgModule({
  declarations: [
    InstalledAppsComponent,
    AvailableAppsComponent,
    AvailableAppsHeaderComponent,
    AppWizardComponent,
    AppCardComponent,
    AppDetailViewComponent,
    AppRouterOutletComponent,
    AppInfoCardComponent,
    AppRowComponent,
    AppDetailsPanelComponent,
    CustomAppFormComponent,
    AppWorkloadsCardComponent,
    AppResourcesCardComponent,
    AppNotesCardComponent,
    AppsScopeWrapperComponent,
    AppAvailableInfoCardComponent,
    ContainerShellComponent,
    ContainerLogsComponent,
    LogsDetailsDialogComponent,
    ShellDetailsDialogComponent,
    AppUpgradeDialogComponent,
    AppDetailsHeaderComponent,
    AppBulkUpgradeComponent,
    AppRollbackModalComponent,
    SelectPoolDialogComponent,
    AppDetailsSimilarComponent,
    AppSettingsButtonComponent,
    AppMetadataCardComponent,
    AppSectionExpandCollapseComponent,
    CategoryViewComponent,
    CustomAppButtonComponent,
    DockerStatusComponent,
    CatalogSettingsComponent,
    DockerImagesListComponent,
    DockerImageDeleteDialogComponent,
    PullImageFormComponent,
    DockerHubRateInfoDialogComponent,
    VolumeMountsDialogComponent,
  ],
  imports: [
    CommonModule,
    AppsRoutingModule,
    PageHeaderModule,
    MatButtonModule,
    TranslateModule,
    IxDynamicFormModule,
    ReactiveFormsModule,
    EntityModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatDialogModule,
    MatMenuModule,
    ImgFallbackModule,
    NgxSkeletonLoaderModule,
    IxIconModule,
    LazyLoadImageModule,
    TestIdModule,
    AppLoaderModule,
    CommonDirectivesModule,
    MatExpansionModule,
    TerminalModule,
    MatTooltipModule,
    MatMenuModule,
    CustomFormsModule,
    GalleryModule,
    LightboxModule,
    MarkdownModule,
    IxTableModule,
    LayoutModule,
    SearchInput1Component,
    EmptyComponent,
    MatSort,
    MatColumnDef,
    MatSortHeader,
    AppCardLogoComponent,
    AppStateCellComponent,
    AppUpdateCellComponent,
    ToolbarSliderComponent,
    FormatDateTimePipe,
    MapValuePipe,
    CleanLinkPipe,
    BulkListItemComponent,
    FileSizePipe,
    NetworkSpeedPipe,
    OrNotAvailablePipe,
    IxModalHeaderComponent,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    IxChipsComponent,
    IxSelectComponent,
    IxCheckboxListComponent,
    IxCheckboxComponent,
    ReadOnlyComponent,
  ],
})
export class AppsModule { }
