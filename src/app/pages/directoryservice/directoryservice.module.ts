import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from '../../appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';

import { SystemGeneralService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { ActiveDirectoryComponent } from './activedirectory/activedirectory.component';
import { routing } from './directoryservice.routing';
import { LdapComponent } from './ldap/ldap.component';
import { NISComponent } from './nis/';
import { KerberosRealmsListComponent } from './kerberosrealms/kerberosrealms-list/kerberosrealms-list.component';
import { KerberosRealmsFormComponent } from './kerberosrealms/kerberosrealms-form/kerberosrealms-form.component';
import { KerberosSettingsComponent } from './kerberossettings/kerberossettings.component';
import { KerberosKeytabsListComponent } from './kerberoskeytabs/kerberoskeytabs-list/kerberoskeytabs-list.component';
import { KerberosKeytabsFormComponent } from './kerberoskeytabs/kerberoskeytabs-form/kerberoskeytabs-form.component';
import { IdmapListComponent } from './idmap-list/idmap-list.component';
import { IdmapFormComponent } from './idmap-form/idmap-form.component';
import { DirectoryservicesComponent } from './directoryservices.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  imports: [
    CommonModule, EntityModule, FormsModule, ReactiveFormsModule, FlexLayoutModule, 
    NgxUploaderModule, routing, MaterialModule, TranslateModule
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
    DirectoryservicesComponent,
  ],
  providers: [SystemGeneralService]
}) export class DirectoryServiceModule {}
