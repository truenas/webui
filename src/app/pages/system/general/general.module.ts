import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';
import { MaterialModule } from '@angular/material';

import { EntityModule } from '../../common/entity/entity.module';
import { GeneralComponent } from './general.component';
import { ConfigSaveComponent } from './config-save/config-save.component';
import { ConfigUploadComponent } from './config-upload/config-upload.component';
import { ConfigResetComponent } from './config-reset/config-reset.component';
import { routing } from './general.routing';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing,
    MaterialModule
  ],
  declarations: [
    GeneralComponent,
    ConfigUploadComponent,
    ConfigResetComponent,
    ConfigSaveComponent
  ],
  providers: []
})
export class SystemGeneralModule {}
