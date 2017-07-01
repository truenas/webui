import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {BootEnvironmentCloneComponent} from './bootenv-clone/';
import {BootEnvironmentDeleteComponent} from './bootenv-delete/';
import {BootEnvironmentListComponent} from './bootenv-list/';
import {routing} from './bootenv.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    BootEnvironmentListComponent, BootEnvironmentDeleteComponent,
    BootEnvironmentCloneComponent
  ],
  providers : []
})
export class BootEnvironmentsModule {
}
