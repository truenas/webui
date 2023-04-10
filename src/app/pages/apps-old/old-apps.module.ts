import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { ApplicationsRoutingModule } from 'app/pages/apps-old/applications-routing.module';
import { ApplicationsComponent } from 'app/pages/apps-old/applications.component';
import { CatalogComponent } from 'app/pages/apps-old/catalog/catalog.component';
import { ChartReleasesComponent } from 'app/pages/apps-old/chart-releases/chart-releases.component';
import { CatalogSummaryDialogComponent } from 'app/pages/apps-old/dialogs/catalog-summary/catalog-summary-dialog.component';
import { ChartBulkUpgradeComponent } from 'app/pages/apps-old/dialogs/chart-bulk-upgrade/chart-bulk-upgrade.component';
import { ChartEventsDialogComponent } from 'app/pages/apps-old/dialogs/chart-events/chart-events-dialog.component';
import { ChartUpgradeDialogComponent } from 'app/pages/apps-old/dialogs/chart-upgrade/chart-upgrade-dialog.component';
import { ManageCatalogSummaryDialogComponent } from 'app/pages/apps-old/dialogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import {
  PodSelectLogsDialogComponent,
} from 'app/pages/apps-old/dialogs/pod-select-logs/pod-select-logs-dialog.component';
import { PodSelectDialogComponent } from 'app/pages/apps-old/dialogs/pod-select/pod-select-dialog.component';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps-old/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImageUpdateDialogComponent } from 'app/pages/apps-old/docker-images/docker-image-update-dialog/docker-image-update-dialog.component';
import { DockerImagesListComponent } from 'app/pages/apps-old/docker-images/docker-images-list/docker-images-list.component';
import { DockerImagesComponentStore } from 'app/pages/apps-old/docker-images/docker-images.store';
import { PullImageFormComponent } from 'app/pages/apps-old/docker-images/pull-image-form/pull-image-form.component';
import { CatalogAddFormComponent } from 'app/pages/apps-old/forms/catalog-add-form/catalog-add-form.component';
import { CatalogEditFormComponent } from 'app/pages/apps-old/forms/catalog-edit-form/catalog-edit-form.component';
import { ChartFormComponent } from 'app/pages/apps-old/forms/chart-form/chart-form.component';
import { KubernetesSettingsComponent } from 'app/pages/apps-old/kubernetes-settings/kubernetes-settings.component';
import { ManageCatalogsComponent } from 'app/pages/apps-old/manage-catalogs/manage-catalogs.component';
import { PodLogsComponent } from 'app/pages/apps-old/pod-logs/pod-logs.component';
import { PodShellComponent } from 'app/pages/apps-old/pod-shell/pod-shell.component';
import { SelectPoolDialogComponent } from 'app/pages/apps-old/select-pool-dialog/select-pool-dialog.component';
import { ChartRollbackModalComponent } from './chart-rollback-modal/chart-rollback-modal.component';
import { CommonAppsToolbarButtonsComponent } from './common-apps-toolbar-buttons/common-apps-toolbar-buttons.component';

@NgModule({
  imports: [
    AppLoaderModule,
    AppCommonModule,
    ApplicationsRoutingModule,
    CastModule,
    CommonDirectivesModule,
    CoreComponents,
    EntityModule,
    FlexLayoutModule,
    FormsModule,
    ImgFallbackModule,
    JobsModule,
    IxDynamicFormModule,
    IxTableModule,
    LayoutModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    IxIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TerminalModule,
    TranslateModule,
    MatProgressSpinnerModule,
    TestIdModule,
  ],
  declarations: [
    ApplicationsComponent,
    CatalogAddFormComponent,
    CatalogComponent,
    CatalogEditFormComponent,
    CatalogSummaryDialogComponent,
    ChartEventsDialogComponent,
    ChartFormComponent,
    ChartReleasesComponent,
    ChartUpgradeDialogComponent,
    CommonAppsToolbarButtonsComponent,
    DockerImageDeleteDialogComponent,
    DockerImagesListComponent,
    DockerImageUpdateDialogComponent,
    KubernetesSettingsComponent,
    ManageCatalogsComponent,
    ManageCatalogSummaryDialogComponent,
    PodLogsComponent,
    PodShellComponent,
    PodSelectDialogComponent,
    PodSelectLogsDialogComponent,
    PullImageFormComponent,
    SelectPoolDialogComponent,
    ChartRollbackModalComponent,
    ChartBulkUpgradeComponent,
  ],
  providers: [
    DockerImagesComponentStore,
  ],
})
export class OldAppsModule { }
