import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ChartFormComponent } from './forms/chart-form.component';

@NgModule({
  imports: [
    CommonModule,
    ApplicationsRoutingModule,
    MaterialModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule,
    EntityModule,
    CoreComponents
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
  ]
})
export class ApplicationsModule { }
