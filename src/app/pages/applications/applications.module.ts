import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { MaterialModule } from 'app/app-material.module';
import { AppCommonModule } from 'app/components/common/app-common.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { CatalogAddFormComponent } from 'app/pages/applications/forms/catalog-add-form/catalog-add-form.component';
import { CatalogEditFormComponent } from 'app/pages/applications/forms/catalog-edit-form/catalog-edit-form.component';
import { EntityModule } from '../../modules/entity/entity.module';
import { ApplicationsRoutingModule } from './applications-routing.module';
import { ApplicationsComponent } from './applications.component';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartReleasesComponent } from './chart-releases/chart-releases.component';
import { CatalogSummaryDialogComponent } from './dialogs/catalog-summary/catalog-summary-dialog.component';
import { ChartEventsDialogComponent } from './dialogs/chart-events/chart-events-dialog.component';
import { ChartUpgradeDialogComponent } from './dialogs/chart-upgrade/chart-upgrade-dialog.component';
import { ManageCatalogSummaryDialogComponent } from './dialogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import { DockerImagesComponent } from './docker-images/docker-images.component';
import { ChartFormComponent } from './forms/chart-form.component';
import { ChartWizardComponent } from './forms/chart-wizard.component';
import { PullImageFormComponent } from './forms/pull-image-form/pull-image-form.component';
import { KubernetesSettingsComponent } from './kubernetes-settings/kubernetes-settings.component';
import { ManageCatalogsComponent } from './manage-catalogs/manage-catalogs.component';
import { PodLogsComponent } from './pod-logs/pod-logs.component';
import { PodShellComponent } from './pod-shell/pod-shell.component';

@NgModule({
  imports: [
    AppCommonModule,
    ApplicationsRoutingModule,
    MaterialModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule,
    EntityModule,
    CoreComponents,
    FormsModule,
    ReactiveFormsModule,
    ImgFallbackModule,
    TerminalModule,
    IxFormsModule,
    CastModule,
  ],
  declarations: [
    ApplicationsComponent,
    CatalogComponent,
    ChartReleasesComponent,
    DockerImagesComponent,
    ChartFormComponent,
    ChartWizardComponent,
    PodShellComponent,
    PodLogsComponent,
    ChartEventsDialogComponent,
    ChartUpgradeDialogComponent,
    CatalogSummaryDialogComponent,
    ManageCatalogsComponent,
    ManageCatalogSummaryDialogComponent,
    PullImageFormComponent,
    KubernetesSettingsComponent,
    CatalogAddFormComponent,
    CatalogEditFormComponent,
  ],
})
export class ApplicationsModule { }
