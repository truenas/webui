import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';
import {NgUploaderModule} from 'ngx-uploader';

import {NgaModule} from '../../theme/nga.module';
import {FnCommonModule} from '../common/common.module';
import {EntityModule} from '../common/entity/entity.module';

import {AdvancedComponent} from './advanced/';
import {EmailComponent} from './email/';
import {SupportComponent} from './support';
import {
  ConfigResetComponent,
  ConfigSaveComponent,
  ConfigUploadComponent,
  GeneralComponent
} from './general/';
import {routing} from './system.routing';
import {UpdateComponent} from './update/';

@NgModule({
  imports : [
    EntityModule, FnCommonModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, NgUploaderModule, routing
  ],
  declarations : [
    AdvancedComponent,
    EmailComponent,
    GeneralComponent,
    ConfigSaveComponent,
    ConfigUploadComponent,
    ConfigResetComponent,
    UpdateComponent,
    SupportComponent
  ],
  providers : []
})
export class SystemModule {
}
