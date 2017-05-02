import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';

import { EntityModule } from '../common/entity/entity.module';
import { routing }       from './jails.routing';

import { JailListComponent } from './jail-list/';

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
	],
	providers: [
	]
})
export class JailsModule {}