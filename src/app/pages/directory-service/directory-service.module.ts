import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/app-material.module';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import { routing } from 'app/pages/directory-service/directory-service.routing';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { SystemGeneralService } from 'app/services';
import { EntityModule } from '../common/entity/entity.module';
import { IdmapFormComponent } from './components/idmap/idmap-form.component';
import { IdmapListComponent } from './components/idmap/idmap-list.component';
import { KerberosRealmsFormComponent } from './components/kerberos-realms-form/kerberos-realms-form.component';
import { LdapComponent } from './components/ldap/ldap.component';

@NgModule({
  imports: [
    CommonModule,
    EntityModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    NgxUploaderModule,
    routing,
    MaterialModule,
    TranslateModule,
    CdkAccordionModule,
    IxFormsModule,
  ],
  declarations: [
    LdapComponent,
    ActiveDirectoryComponent,
    KerberosRealmsListComponent,
    KerberosRealmsFormComponent,
    KerberosSettingsComponent,
    KerberosKeytabsListComponent,
    KerberosKeytabsFormComponent,
    IdmapListComponent,
    IdmapFormComponent,
    DirectoryServicesComponent,
  ],
  providers: [SystemGeneralService],
}) export class DirectoryServiceModule { }
