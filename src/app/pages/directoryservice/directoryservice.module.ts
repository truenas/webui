import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';
import { MaterialModule } from '../../appMaterial.module';

import { SystemGeneralService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { ActiveDirectoryComponent } from './activedirectory/';
import { routing } from './directoryservice.routing';
import { LdapComponent } from './ldap/';
import { NISComponent } from './nis/';
import { IdmapComponent } from './idmap';
import { KerberosRealmsListComponent } from './kerberosrealms/kerberosrealms-list';
import { KerberosRealmsFormComponent } from './kerberosrealms/kerberosrealms-form';
import { KerberosSettingsComponent } from './kerberossettings';

@NgModule({
  imports: [
    CommonModule, EntityModule, FormsModule, ReactiveFormsModule,
    NgUploaderModule, routing, MaterialModule
  ],
  declarations: [
    LdapComponent,
    ActiveDirectoryComponent,
    NISComponent,
    IdmapComponent,
    KerberosRealmsListComponent,
    KerberosRealmsFormComponent,
    KerberosSettingsComponent,
  ],
  providers: [SystemGeneralService]
}) export class DirectoryServiceModule {}
