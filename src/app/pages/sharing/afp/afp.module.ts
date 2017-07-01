import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {AFPAddComponent} from './afp-add/';
import {AFPDeleteComponent} from './afp-delete/';
import {AFPEditComponent} from './afp-edit/';
import {AFPListComponent} from './afp-list/';
import {routing} from './afp.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    AFPListComponent,
    AFPAddComponent,
    AFPEditComponent,
    AFPDeleteComponent,
  ],
  providers : []
})
export class AFPModule {
}
