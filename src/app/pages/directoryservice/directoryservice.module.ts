import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/appMaterial.module';
import { SystemGeneralService } from 'app/services';
import { EntityModule } from '../common/entity/entity.module';
import { ActiveDirectoryComponent } from './activedirectory/activedirectory.component';
import { routing } from './directoryservice.routing';
import { DirectoryservicesComponent } from './directoryservices.component';
import { IdmapFormComponent } from './idmap/idmap-form.component';
import { IdmapListComponent } from './idmap/idmap-list.component';
import { KerberosKeytabsFormComponent } from './kerberoskeytabs/kerberoskeytabs-form.component';
import { KerberosKeytabsListComponent } from './kerberoskeytabs/kerberoskeytabs-list.component';
import { KerberosRealmsFormComponent } from './kerberosrealms/kerberosrealms-form.component';
import { KerberosRealmsListComponent } from './kerberosrealms/kerberosrealms-list.component';
import { KerberosSettingsComponent } from './kerberossettings/kerberossettings.component';
import { LdapComponent } from './ldap/ldap.component';
import { NISComponent } from './nis';

@NgModule({
  imports: [
    CommonModule, EntityModule, FormsModule, ReactiveFormsModule, FlexLayoutModule,
    NgxUploaderModule, routing, MaterialModule, TranslateModule,
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
  providers: [SystemGeneralService],
}) export class DirectoryServiceModule { }
