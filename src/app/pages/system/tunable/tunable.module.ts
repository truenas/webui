import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';
import {NgUploaderModule} from 'ngx-uploader';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';
import {CommonFormComponent} from '../../common/form/';

import {TunableAddComponent} from './tunable-add';
import {TunableDeleteComponent} from './tunable-delete/';
import {TunableEditComponent} from './tunable-edit';
import {TunableFormComponent} from './tunable-form/';
import {TunableListComponent} from './tunable-list/';
import {routing} from './tunable.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, NgUploaderModule, routing
  ],
  declarations :
      [ TunableAddComponent, TunableListComponent,TunableEditComponent, TunableDeleteComponent, TunableFormComponent ],
  providers : []
})
export class TunableModule {
}
