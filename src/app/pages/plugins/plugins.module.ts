import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';
import { MaterialModule } from '../../appMaterial.module';

import {EntityModule} from '../common/entity/entity.module';

import {routing} from './plugins.routing';
import { PluginsAvailabelListComponent } from './plugins-available/plugins-available-list.component';
import { PluginAddComponent } from './plugin-add/plugin-add.component';
import { PluginsInstalledListComponent } from './plugins-installed/plugins-installed.component';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing, MaterialModule
  ],
  declarations : [
  	PluginsAvailabelListComponent,
  	PluginAddComponent,
  	PluginsInstalledListComponent
  ]
})
export class PluginsModule {
}
