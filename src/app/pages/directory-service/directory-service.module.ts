import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapFormComponent } from 'app/pages/directory-service/components/idmap-form/idmap-form.component';
import IdmapListComponent from 'app/pages/directory-service/components/idmap-list/idmap-list.component';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import KerberosKeytabsListComponent from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import KerberosRealmsListComponent from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import {
  LeaveDomainDialogComponent,
} from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { routing } from 'app/pages/directory-service/directory-service.routing';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { KerberosRealmsFormComponent } from './components/kerberos-realms-form/kerberos-realms-form.component';
import { LdapComponent } from './components/ldap/ldap.component';

@NgModule({
  imports: [
    CommonModule,
    AppCommonModule,
    EntityModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    routing,
    MatListModule,
    PageHeaderModule,
    IxTable2Module,
    MatToolbarModule,
    IxIconModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    CdkAccordionModule,
    IxFormsModule,
    IxTableModule,
    MatDialogModule,
    TestIdModule,
    LayoutModule,
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
    LeaveDomainDialogComponent,
  ],
  providers: [SystemGeneralService],
}) export class DirectoryServiceModule { }
