import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';

import {SMBAddComponent} from './smb-add/';
import {SMBDeleteComponent} from './smb-delete/';
import {SMBEditComponent} from './smb-edit/';
import {SMBListComponent} from './smb-list/';
import {routing} from './smb.routing';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing
  ],
  declarations : [
    SMBListComponent,
    SMBAddComponent,
    SMBEditComponent,
    SMBDeleteComponent,
  ],
  providers : []
})
export class SMBModule {
}
