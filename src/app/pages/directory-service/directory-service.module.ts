import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapFormComponent } from 'app/pages/directory-service/components/idmap-form/idmap-form.component';
import { IdmapListComponent } from 'app/pages/directory-service/components/idmap-list/idmap-list.component';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
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
    EntityModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    routing,
    MatListModule,
    PageHeaderModule,
    IxTableModule,
    MatToolbarModule,
    IxIconModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    CdkAccordionModule,
    IxFormsModule,
    MatDialogModule,
    TestIdModule,
    LayoutModule,
    CommonDirectivesModule,
    SearchInput1Component,
    EmptyComponent,
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
