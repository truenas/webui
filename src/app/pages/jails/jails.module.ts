import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';

import { EntityModule } from '../common/entity/entity.module';
import { routing }       from './jails.routing';
import { JailService } from '../../services';

import { JailListComponent } from './jail-list/';
import { JailAddComponent } from './jail-add/';
import { JailEditComponent } from './jail-edit/';
import { JailDeleteComponent } from './jail-delete/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
import { StorageDeleteComponent } from './storages/storage-delete/';
import { JailsConfigurationComponent } from './configuration/';
import { TemplateListComponent } from './templates/template-list/';
import { TemplateFormComponent } from './templates/template-form/';
import { TemplateDeleteComponent } from './templates/template-delete/';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		NgaModule,
		DynamicFormsCoreModule.forRoot(),
		DynamicFormsBootstrapUIModule,
		routing,
		EntityModule
	],
	declarations: [
		JailListComponent,
		JailAddComponent,
		JailEditComponent,
		JailDeleteComponent,
		StorageListComponent,
		StorageFormComponent,
		StorageDeleteComponent,
		JailsConfigurationComponent,
		TemplateListComponent,
		TemplateFormComponent,
		TemplateDeleteComponent,
	],
	providers: [
		JailService,
	]
})
export class JailsModule {}