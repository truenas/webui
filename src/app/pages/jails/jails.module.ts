import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { JailService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { routing } from './jails.routing';
import { JailsConfigurationComponent } from './configuration/';
// import { JailDeleteComponent } from './jail-delete/';

import { JailListComponent } from './jail-list/';
import { JailFormComponent } from './jail-form/';
// import { StorageDeleteComponent } from './storages/storage-delete/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
// import { TemplateDeleteComponent } from './templates/template-delete/';
// import { TemplateFormComponent } from './templates/template-form/';
import { TemplateListComponent } from './templates/template-list/';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule, routing, EntityModule
  ],
  declarations : [
    JailsConfigurationComponent,
    JailListComponent,
    JailFormComponent,
    // JailDeleteComponent,
    StorageListComponent,
    StorageFormComponent,
    // StorageDeleteComponent,
    TemplateListComponent,
    // TemplateFormComponent,
    // TemplateDeleteComponent,
  ],
  providers : [
    JailService,
  ]
})
export class JailsModule {
}