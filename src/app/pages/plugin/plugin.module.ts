import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../theme/nga.module';
import {EntityModule} from '../common/entity/entity.module';

import {
  PluginConfigurationComponent
} from './configuration/configuration.component';
import {
  PluginDeleteComponent
} from './installed/plugin-delete/plugin-delete.component';
import {
  PluginListComponent
} from './installed/plugin-list/plugin-list.component';
import {routing} from './plugin.routing';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule, NgaModule,
    DynamicFormsCoreModule.forRoot(), DynamicFormsBootstrapUIModule, routing,
    EntityModule
  ],
  declarations : [
    PluginListComponent,
    PluginDeleteComponent,
    PluginConfigurationComponent,
  ],
  providers : []
})
export class PluginModule {
}