import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/active-directory/active-directory.component';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/kerberos-keytabs/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/kerberos-realms/kerberos-realms-list.component';
import { IdmapListComponent } from './idmap/idmap-list.component';
import { KerberosSettingsComponent } from './kerberos-settings/kerberossettings.component';
import { LdapComponent } from './ldap/ldap.component';
import { NISComponent } from './nis';

export const routes: Routes = [{
  path: '',
  data: { title: 'Directory Services' },
  children: [
    {
      path: '',
      component: DirectoryServicesComponent,
    }, {
      path: 'ldap',
      component: LdapComponent,
      data: { title: 'LDAP', breadcrumb: 'LDAP', icon: 'device_hub' },
    }, {
      path: 'activedirectory',
      component: ActiveDirectoryComponent,
      data: { title: 'Active Directory', breadcrumb: 'Active Directory', icon: 'apps' },
    }, {
      path: 'nis',
      component: NISComponent,
      data: { title: 'NIS', breadcrumb: 'NIS', icon: 'library_books' },
    }, {
      path: 'idmap',
      component: IdmapListComponent,
      data: { title: 'Idmap', breadcrumb: 'Idmap' },
    }, {
      path: 'kerberosrealms',
      component: KerberosRealmsListComponent,
      data: { title: 'Kerberos Realms', breadcrumb: 'Kerberos Realms', icon: 'apps' },
    }, {
      path: 'kerberossettings',
      data: { title: 'Kerberos Settings', breadcrumb: 'Kerberos Settings', icon: 'settings' },
      component: KerberosSettingsComponent,
    }, {
      path: 'kerberoskeytabs',
      component: KerberosKeytabsListComponent,
      data: { title: 'Kerberos Keytab', breadcrumb: 'Kerberos Keytab', icon: 'apps' },
    }],
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
