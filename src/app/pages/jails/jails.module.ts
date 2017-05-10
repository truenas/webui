import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';

import { EntityModule } from '../common/entity/entity.module';
import { routing }       from './jails.routing';

import { JailListComponent } from './jail-list/';
import { JailAddComponent } from './jail-add/';
import { JailEditComponent } from './jail-edit/';
import { JailDeleteComponent } from './jail-delete/';
import { StorageListComponent } from './storages/storage-list/';
import { StorageAddComponent } from './storages/storage-add/';
import { StorageDeleteComponent } from './storages/storage-delete/';
import { StorageEditComponent } from './storages/storage-edit/';

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
		StorageAddComponent,
		StorageDeleteComponent,
		StorageEditComponent,
	],
	providers: [
	]
})
export class JailsModule {}