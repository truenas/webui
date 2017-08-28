import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule, MdTableModule} from '@angular/material';
import {BusyModule} from 'tixif-ngx-busy';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule,
    BusyModule, MaterialModule, MdTableModule
  ],
})
export class FnCommonModule {
}
