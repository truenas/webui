import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { AlertModule } from 'ngx-bootstrap/alert';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { BusyModule } from 'angular2-busy';
import { NgaModule } from '../../theme/nga.module';

import { CommonFormComponent } from './form';

@NgModule({
  imports: [
    AlertModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule,
    BusyModule,
    NgaModule
  ],
  declarations: [CommonFormComponent],
  exports: [CommonFormComponent]
})
export class FnCommonModule { }
