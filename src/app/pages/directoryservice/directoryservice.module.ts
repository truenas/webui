import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';

import {SystemGeneralService} from '../../services';
import {NgaModule} from '../../theme/nga.module';
import {FnCommonModule} from '../common/common.module';
import {EntityModule} from '../common/entity/entity.module';

import {ActiveDirectoryComponent} from './activedirectory/';
import {routing} from './directoryservice.routing';
import {LdapComponent} from './ldap/';
import {NISComponent} from './nis/';
import {NT4Component} from './nt4/nt4.component';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, NgUploaderModule, FnCommonModule,
    routing
  ],
  declarations : [ LdapComponent, ActiveDirectoryComponent, NISComponent,NT4Component ],
  providers : [ SystemGeneralService ]
}) export class DirectoryServiceModule {}
