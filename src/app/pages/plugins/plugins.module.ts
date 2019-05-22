import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';
import { MaterialModule } from '../../appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';

import {EntityModule} from '../common/entity/entity.module';

import {routing} from './plugins.routing';
import { PluginsAvailabelListComponent } from './plugins-available/plugins-available-list.component';
import { PluginAddComponent } from './plugin-add/plugin-add.component';
import { PluginsInstalledListComponent } from './plugins-installed/plugins-installed.component';
import { PluginAdvancedAddComponent } from './plugin-advanced-add/plugin-advanced-add.component';
import { PluginsComponent } from './plugins.component';
import { PluginComponent } from './plugin/plugin.component';
import { AvailablePluginsComponent } from './available-plugins/available-plugins.component';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing, MaterialModule, TranslateModule,
    FlexLayoutModule
  ],
  declarations : [
  	PluginsAvailabelListComponent,
  	PluginAddComponent,
    PluginsInstalledListComponent,
    PluginAdvancedAddComponent,
    PluginsComponent,
    PluginComponent,
    AvailablePluginsComponent,
  ],
  entryComponents: [AvailablePluginsComponent, PluginComponent]
})
export class PluginsModule {
}
