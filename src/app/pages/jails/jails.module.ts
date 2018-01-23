import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';

import { JailService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { routing } from './jails.routing';
import { JailsConfigurationComponent } from './configuration/';
import { JailListComponent } from './jail-list/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
import { TemplateListComponent } from './templates/template-list/';
import { TemplateFormComponent } from './templates/template-form/';
import { JailAddComponent } from './jail-add/';
import { JailEditComponent } from './jail-edit/';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule, routing, EntityModule, MaterialModule
  ],
  declarations : [
    JailsConfigurationComponent,
    JailListComponent,
    StorageListComponent,
    StorageFormComponent,
    TemplateListComponent,
    TemplateFormComponent,
    JailAddComponent,
    JailEditComponent
  ],
  providers : [
    JailService,
  ]
})
export class JailsModule {
}