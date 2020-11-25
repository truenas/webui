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
import { ChartsComponent } from './charts/charts.component';
import { DockerImagesComponent } from './docker-images/docker-images.component';
import { KubernetesSettingsComponent } from './forms/kubernetes-settings.component';
import { ChartReleaseSettingsComponent } from './forms/chart-release-settings.component';


@NgModule({
  imports: [
    CommonModule,
    ApplicationsRoutingModule,
    MaterialModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule,
    EntityModule
  ],
  declarations: [
    ApplicationsComponent,
    CatalogComponent,
    ChartsComponent,
    DockerImagesComponent,
    KubernetesSettingsComponent,
    ChartReleaseSettingsComponent
  ]
})
export class ApplicationsModule { }
