import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../common/entity/entity.module';
import { FnCommonModule } from '../common/common.module';
import { routing } from './directoryservice.routing';

import { LdapComponent } from './ldap/';
import { ActiveDirectoryComponent } from './activedirectory/';
import { NISComponent } from './nis/'
import {NT4Component} from './nt4/'

import { SystemGeneralService } from '../../services';

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
    FnCommonModule,
    routing
  ],
  declarations: [
    LdapComponent,
    ActiveDirectoryComponent,
    NISComponent,
    NT4Component
  ],
  providers: [
    SystemGeneralService
  ]
})
export class DirectoryServiceModule { }
