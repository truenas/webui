import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../../common/entity/entity.module';
import { CommonFormComponent } from '../../common/form/';
import { routing } from './tunable.routing';

import { TunableListComponent } from './tunable-list/';
import { TunableAddComponent } from './tunable-add/';
import { TunableEditComponent } from './tunable-edit/';
import { TunableDeleteComponent } from './tunable-delete/';

@NgModule({
  imports: [
    EntityModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    NgUploaderModule,
    routing
  ],
  declarations: [
    TunableListComponent,
    TunableAddComponent,
    TunableDeleteComponent,
    TunableEditComponent,
  ],
  providers: [
  ]
})
export class TunableModule {}