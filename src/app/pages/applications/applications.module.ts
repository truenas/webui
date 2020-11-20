import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { MaterialModule } from '../../appMaterial.module';

import { FlexLayoutModule } from '@angular/flex-layout';

import { ApplicationsComponent } from './applications.component';
import { ApplicationsRoutingModule } from './applications-routing.module';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartsComponent } from './charts/charts.component';
import { DockerImagesComponent } from './docker-images/docker-images.component';


@NgModule({
  imports: [
    CommonModule,
    ApplicationsRoutingModule,
    MaterialModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule
  ],
  declarations: [
    ApplicationsComponent,
    CatalogComponent,
    ChartsComponent,
    DockerImagesComponent
  ]
})
export class ApplicationsModule { }
