import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from '../common/entity/entity.module';
import { AvailablePluginsComponent } from './available-plugins/available-plugins.component';
import { PluginAddComponent } from './plugin-add/plugin-add.component';
import { PluginsComponent } from './plugins.component';
import { routing } from './plugins.routing';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing, MaterialModule, TranslateModule,
    FlexLayoutModule, CommonDirectivesModule,
  ],
  declarations: [
  	PluginAddComponent,
    PluginsComponent,
    AvailablePluginsComponent,
  ],
  entryComponents: [AvailablePluginsComponent],
})
export class PluginsModule {
}
