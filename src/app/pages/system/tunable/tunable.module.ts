import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../../common/entity/entity.module';

import { TunableDeleteComponent } from './tunable-delete/';
import { TunableFormComponent } from './tunable-form/';
import { TunableListComponent } from './tunable-list/';
import { routing } from './tunable.routing';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing
  ],
  declarations: [TunableListComponent,
    TunableDeleteComponent,
    TunableFormComponent
  ],
  providers: []
})
export class TunableModule {}
