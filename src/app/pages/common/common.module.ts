import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from '@angular/material';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';
import {BusyModule} from 'tixif-ngx-busy';
import {AlertModule} from 'ngx-bootstrap/alert';

import {NgaModule} from '../../theme/nga.module';

import {CommonFormComponent} from './form';

@NgModule({
  imports : [
    AlertModule, CommonModule, FormsModule, ReactiveFormsModule,
    DynamicFormsCoreModule.forRoot(), DynamicFormsBootstrapUIModule, BusyModule,
    NgaModule, MaterialModule
  ],
  declarations : [ CommonFormComponent ],
  exports : [ CommonFormComponent ]
})
export class FnCommonModule {
}
