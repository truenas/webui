import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';

import { EntityModule } from '../common/entity/entity.module';
import { routing }       from './plugin.routing';

import { PluginListComponent } from './installed/plugin-list/plugin-list.component';
import { PluginDeleteComponent } from './installed/plugin-delete/plugin-delete.component';
import { PluginConfigurationComponent } from './configuration/configuration.component';

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
		PluginListComponent,
		PluginDeleteComponent,
		PluginConfigurationComponent,
	],
	providers: [
	]
})
export class PluginModule {}