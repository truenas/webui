import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule, MdTableModule} from '@angular/material';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {BusyModule} from 'tixif-ngx-busy';

import {CommonFormComponent} from './form';
import { FormComponent } from './form/form.component';

@NgModule({
  imports : [
    AlertModule, CommonModule, FormsModule, ReactiveFormsModule,
    DynamicFormsCoreModule.forRoot(), BusyModule,
    NgaModule, MaterialModule, MdTableModule
  ],
  declarations : [ CommonFormComponent, FormComponent ],
  exports : [ CommonFormComponent ]
})
export class FnCommonModule {
}
