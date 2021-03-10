import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { MaterialModule } from '../../appMaterial.module';
import { EntityModule } from '../common/entity/entity.module';

import { FlexLayoutModule } from '@angular/flex-layout';

import { ApplicationsComponent } from './applications.component';
import { ApplicationsRoutingModule } from './applications-routing.module';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartReleasesComponent } from './chart-releases/chart-releases.component';
import { DockerImagesComponent } from './docker-images/docker-images.component';
import { KubernetesSettingsComponent } from './forms/kubernetes-settings.component';
import { ChartReleaseAddComponent } from './forms/chart-release-add.component';
import { ChartReleaseEditComponent } from './forms/chart-release-edit.component';
import { CoreComponents } from 'app/core/components/corecomponents.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PodShellComponent } from './pod-shell/pod-shell.component';
import { ChartFormComponent } from './forms/chart-form.component';
import { ChartWizardComponent } from './forms/chart-wizard.component';
import { PodLogsComponent } from './pod-logs/pod-logs.component';
import { ChartEventsDialog } from './dialogs/chart-events/chart-events-dialog.component';
import { AppCommonModule } from '../../components/common/app-common.module';

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
  ],
  exports: [
  ],
  declarations: [
    ApplicationsComponent,
    CatalogComponent,
    ChartReleasesComponent,
    DockerImagesComponent,
    KubernetesSettingsComponent,
    ChartReleaseAddComponent,
    ChartReleaseEditComponent,
    ChartFormComponent,
    ChartWizardComponent,
    PodShellComponent,
    PodLogsComponent,
    ChartEventsDialog,
  ]
})
export class ApplicationsModule { }
