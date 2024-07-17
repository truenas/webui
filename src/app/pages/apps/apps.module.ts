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
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
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
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppsRoutingModule } from 'app/pages/apps/apps-routing.module';
import {
  AppDetailsHeaderComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import {
  AppDetailsSimilarComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-similar/app-details-similar.component';
import { AppsScopeWrapperComponent } from 'app/pages/apps/components/apps-scope-wrapper.component';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImageUpdateDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-update-dialog/docker-image-update-dialog.component';
import { DockerImagesListComponent } from 'app/pages/apps/components/docker-images/docker-images-list/docker-images-list.component';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { DockerHubRateInfoDialogComponent } from 'app/pages/apps/components/dockerhub-rate-limit-info-dialog/dockerhub-rate-limit-info-dialog.component';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { KubernetesSettingsComponent } from 'app/pages/apps/components/installed-apps/kubernetes-settings/kubernetes-settings.component';
import { PodLogsComponent } from 'app/pages/apps/components/installed-apps/pod-logs/pod-logs.component';
import { PodShellComponent } from 'app/pages/apps/components/installed-apps/pod-shell/pod-shell.component';
import { PodSelectDialogComponent } from 'app/pages/apps/components/pod-select-dialog/pod-select-dialog.component';
import { PodSelectLogsDialogComponent } from 'app/pages/apps/components/pod-select-logs/pod-select-logs-dialog.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
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
import { AppContainersCardComponent } from './components/installed-apps/app-containers-card/app-containers-card.component';
import { AppDetailsPanelComponent } from './components/installed-apps/app-details-panel/app-details-panel.component';
import { AppHistoryCardComponent } from './components/installed-apps/app-history-card/app-history-card.component';
import { AppMetadataCardComponent } from './components/installed-apps/app-metadata-card/app-metadata-card.component';
import { AppStatusCellComponent } from './components/installed-apps/app-status-cell/app-status-cell.component';
import { AppUpgradeDialogComponent } from './components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { InstalledAppsComponent } from './components/installed-apps/installed-apps.component';
import { KubernetesStatusComponent } from './components/installed-apps/kubernetes-status/kubernetes-status.component';

@NgModule({
  declarations: [
    InstalledAppsComponent,
    AvailableAppsComponent,
    AvailableAppsHeaderComponent,
    ChartWizardComponent,
    AppCardComponent,
    AppDetailViewComponent,
    AppRouterOutletComponent,
    AppInfoCardComponent,
    AppRowComponent,
    AppDetailsPanelComponent,
    AppContainersCardComponent,
    AppHistoryCardComponent,
    KubernetesSettingsComponent,
    AppResourcesCardComponent,
    AppsScopeWrapperComponent,
    AppAvailableInfoCardComponent,
    PodLogsComponent,
    PodShellComponent,
    PodSelectDialogComponent,
    PodSelectLogsDialogComponent,
    AppUpgradeDialogComponent,
    AppDetailsHeaderComponent,
    AppBulkUpgradeComponent,
    AppRollbackModalComponent,
    DockerHubRateInfoDialogComponent,
    SelectPoolDialogComponent,
    AppDetailsSimilarComponent,
    AppSettingsButtonComponent,
    AppMetadataCardComponent,
    AppSectionExpandCollapseComponent,
    CategoryViewComponent,
    CustomAppButtonComponent,
    KubernetesStatusComponent,
    DockerImagesListComponent,
    DockerImageUpdateDialogComponent,
    DockerImageDeleteDialogComponent,
    PullImageFormComponent,
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
    FlexLayoutModule,
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
    AppStatusCellComponent,
    AppUpdateCellComponent,
    ToolbarSliderComponent,
    FormatDateTimePipe,
    MapValuePipe,
    CleanLinkPipe,
    BulkListItemComponent,
    FileSizePipe,
    NetworkSpeedPipe,
  ],
})
export class AppsModule { }
