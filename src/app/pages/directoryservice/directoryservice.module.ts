import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';
import { MaterialModule } from '../../appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';

import { SystemGeneralService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { ActiveDirectoryComponent } from './activedirectory/';
import { routing } from './directoryservice.routing';
import { LdapComponent } from './ldap/';
import { NISComponent } from './nis/';
import { KerberosRealmsListComponent } from './kerberosrealms/kerberosrealms-list';
import { KerberosRealmsFormComponent } from './kerberosrealms/kerberosrealms-form';
import { KerberosSettingsComponent } from './kerberossettings';
import { KerberosKeytabsListComponent } from './kerberoskeytabs/kerberoskeytabs-list';
import { KerberosKeytabsFormComponent } from './kerberoskeytabs/kerberoskeytabs-form';
import { IdmapListComponent } from './idmap-list/idmap-list.component';
import { IdmapFormComponent } from './idmap-form/idmap-form.component';

@NgModule({
  imports: [
    CommonModule, EntityModule, FormsModule, ReactiveFormsModule,
    NgUploaderModule, routing, MaterialModule, TranslateModule
  ],
  declarations: [
    LdapComponent,
    ActiveDirectoryComponent,
    NISComponent,
    KerberosRealmsListComponent,
    KerberosRealmsFormComponent,
    KerberosSettingsComponent,
    KerberosKeytabsListComponent,
    KerberosKeytabsFormComponent,
    IdmapListComponent,
    IdmapFormComponent,
  ],
  providers: [SystemGeneralService]
}) export class DirectoryServiceModule {}
