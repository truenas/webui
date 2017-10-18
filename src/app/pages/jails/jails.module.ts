import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';

import { JailService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { routing } from './jails.routing';
import { JailsConfigurationComponent } from './configuration/';
import { JailListComponent } from './jail-list/';
import { JailFormComponent } from './jail-form/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
import { TemplateListComponent } from './templates/template-list/';
import { TemplateFormComponent } from './templates/template-form/';
import { JailAddComponent } from './jail-add/';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule, routing, EntityModule, MaterialModule
  ],
  declarations : [
    JailsConfigurationComponent,
    JailListComponent,
    JailFormComponent,
    StorageListComponent,
    StorageFormComponent,
    TemplateListComponent,
    TemplateFormComponent,
    JailAddComponent
  ],
  providers : [
    JailService,
  ]
})
export class JailsModule {
}