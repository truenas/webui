import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {JailService} from '../../services';
import {NgaModule} from '../../theme/nga.module';
import {EntityModule} from '../common/entity/entity.module';

import {JailsConfigurationComponent} from './configuration/';
import {JailDeleteComponent} from './jail-delete/';
import {JailFormComponent} from './jail-form/';
import {JailListComponent} from './jail-list/';
import {routing} from './jails.routing';
import {StorageDeleteComponent} from './storages/storage-delete/';
import {StorageFormComponent} from './storages/storage-form/';
import {StorageListComponent} from './storages/storage-list/';
import {TemplateDeleteComponent} from './templates/template-delete/';
import {TemplateFormComponent} from './templates/template-form/';
import {TemplateListComponent} from './templates/template-list/';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule, NgaModule,
    DynamicFormsCoreModule.forRoot(), DynamicFormsBootstrapUIModule, routing,
    EntityModule
  ],
  declarations : [
    JailListComponent,
    JailFormComponent,
    JailDeleteComponent,
    StorageListComponent,
    StorageFormComponent,
    StorageDeleteComponent,
    JailsConfigurationComponent,
    TemplateListComponent,
    TemplateFormComponent,
    TemplateDeleteComponent,
  ],
  providers : [
    JailService,
  ]
})
export class JailsModule {
}