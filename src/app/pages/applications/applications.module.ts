import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { AppCommonModule } from 'app/components/common/app-common.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { ApplicationsRoutingModule } from 'app/pages/applications/applications-routing.module';
import { ApplicationsComponent } from 'app/pages/applications/applications.component';
import { CatalogComponent } from 'app/pages/applications/catalog/catalog.component';
import { ChartReleasesComponent } from 'app/pages/applications/chart-releases/chart-releases.component';
import { CatalogSummaryDialogComponent } from 'app/pages/applications/dialogs/catalog-summary/catalog-summary-dialog.component';
import { ChartEventsDialogComponent } from 'app/pages/applications/dialogs/chart-events/chart-events-dialog.component';
import { ChartUpgradeDialogComponent } from 'app/pages/applications/dialogs/chart-upgrade/chart-upgrade-dialog.component';
import { ManageCatalogSummaryDialogComponent } from 'app/pages/applications/dialogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import { DockerImagesComponent } from 'app/pages/applications/docker-images/docker-images.component';
import { CatalogAddFormComponent } from 'app/pages/applications/forms/catalog-add-form/catalog-add-form.component';
import { CatalogEditFormComponent } from 'app/pages/applications/forms/catalog-edit-form/catalog-edit-form.component';
import { ChartFormComponent } from 'app/pages/applications/forms/chart-form.component';
import { ChartWizardComponent } from 'app/pages/applications/forms/chart-wizard.component';
import { PullImageFormComponent } from 'app/pages/applications/forms/pull-image-form/pull-image-form.component';
import { KubernetesSettingsComponent } from 'app/pages/applications/kubernetes-settings/kubernetes-settings.component';
import { ManageCatalogsComponent } from 'app/pages/applications/manage-catalogs/manage-catalogs.component';
import { PodLogsComponent } from 'app/pages/applications/pod-logs/pod-logs.component';
import { PodShellComponent } from 'app/pages/applications/pod-shell/pod-shell.component';

@NgModule({
  imports: [
    AppCommonModule,
    ApplicationsRoutingModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule,
    EntityModule,
    CoreComponents,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatTooltipModule,
    MatMenuModule,
    MatIconModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressBarModule,
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
