import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { NgxFilesizeModule } from 'ngx-filesize';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { MarkdownModule } from 'ngx-markdown';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppsRoutingModule } from 'app/pages/apps/apps-routing.module';
import {
  AppDetailsHeaderComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-header/app-details-header.component';
import {
  AppDetailsSimilarComponent,
} from 'app/pages/apps/components/app-detail-view/app-details-similar/app-details-similar.component';
import {
  CatalogAddFormComponent,
} from 'app/pages/apps/components/catalogs/catalog-add-form/catalog-add-form.component';
import { CatalogDeleteDialogComponent } from 'app/pages/apps/components/catalogs/catalog-delete-dialog/catalog-delete-dialog.component';
import {
  CatalogEditFormComponent,
} from 'app/pages/apps/components/catalogs/catalog-edit-form/catalog-edit-form.component';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import {
  ManageCatalogSummaryDialogComponent,
} from 'app/pages/apps/components/catalogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImageUpdateDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-update-dialog/docker-image-update-dialog.component';
import { DockerImagesListComponent } from 'app/pages/apps/components/docker-images/docker-images-list/docker-images-list.component';
import { DockerImagesComponentStore } from 'app/pages/apps/components/docker-images/docker-images.store';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { AppBulkUpgradeComponent } from 'app/pages/apps/components/installed-apps/app-bulk-upgrade/app-bulk-upgrade.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { KubernetesSettingsComponent } from 'app/pages/apps/components/installed-apps/kubernetes-settings/kubernetes-settings.component';
import { PodLogsComponent } from 'app/pages/apps/components/installed-apps/pod-logs/pod-logs.component';
import { PodShellComponent } from 'app/pages/apps/components/installed-apps/pod-shell/pod-shell.component';
import { PodSelectDialogComponent } from 'app/pages/apps/components/pod-select-dialog/pod-select-dialog.component';
import { PodSelectLogsDialogComponent } from 'app/pages/apps/components/pod-select-logs/pod-select-logs-dialog.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { AppsNavigateAwayGuard } from 'app/pages/apps/guards/apps-navigate-away.guard';
import { CustomFormsModule } from 'app/pages/apps/modules/custom-forms/custom-forms.module';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { AppCatalogPipe } from 'app/pages/apps/utils/app-catalog.pipe';
import { AppCardLogoComponent } from './components/app-card-logo/app-card-logo.component';
import { AppAvailableInfoCardComponent } from './components/app-detail-view/app-available-info-card/app-available-info-card.component';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppHelmChartCardComponent } from './components/app-detail-view/app-helm-chart-card/app-helm-chart-card.component';
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
import { AppNotesCardComponent } from './components/installed-apps/app-notes-card/app-notes-card.component';
import { AppStatusCellComponent } from './components/installed-apps/app-status-cell/app-status-cell.component';
import { AppUpgradeDialogComponent } from './components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { InstalledAppsComponent } from './components/installed-apps/installed-apps.component';
import { KubernetesStatusComponent } from './components/installed-apps/kubernetes-status/kubernetes-status.component';

@NgModule({
  declarations: [
    InstalledAppsComponent,
    AvailableAppsComponent,
    AvailableAppsHeaderComponent,
    CatalogsComponent,
    ChartWizardComponent,
    ManageCatalogSummaryDialogComponent,
    CatalogEditFormComponent,
    CatalogAddFormComponent,
    AppCardComponent,
    AppDetailViewComponent,
    AppCardLogoComponent,
    AppRouterOutletComponent,
    AppInfoCardComponent,
    AppRowComponent,
    AppDetailsPanelComponent,
    AppContainersCardComponent,
    AppHistoryCardComponent,
    AppNotesCardComponent,
    KubernetesSettingsComponent,
    AppResourcesCardComponent,
    AppHelmChartCardComponent,
    AppAvailableInfoCardComponent,
    PodLogsComponent,
    PodShellComponent,
    PodSelectDialogComponent,
    PodSelectLogsDialogComponent,
    AppUpgradeDialogComponent,
    AppStatusCellComponent,
    AppDetailsHeaderComponent,
    AppBulkUpgradeComponent,
    AppRollbackModalComponent,
    SelectPoolDialogComponent,
    AppDetailsSimilarComponent,
    AppSettingsButtonComponent,
    AppMetadataCardComponent,
    AppSectionExpandCollapseComponent,
    CategoryViewComponent,
    CatalogDeleteDialogComponent,
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
    NgxFilesizeModule,
    CoreComponents,
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
    AppCommonModule,
    MatExpansionModule,
    CastModule,
    TerminalModule,
    MatTooltipModule,
    MatMenuModule,
    CustomFormsModule,
    GalleryModule,
    LightboxModule,
    MarkdownModule,
    IxTableModule,
    IxTable2Module,
    LayoutModule,
    AppCatalogPipe,
  ],
  providers: [
    AppsStore,
    AppsFilterStore,
    KubernetesStore,
    InstalledAppsStore,
    AppsNavigateAwayGuard,
    DockerImagesComponentStore,
  ],
})
export class AppsModule { }
