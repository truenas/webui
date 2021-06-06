import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActiveDirectoryComponent } from './activedirectory/activedirectory.component';
import { DirectoryservicesComponent } from './directoryservices.component';
import { IdmapListComponent } from './idmap/idmap-list.component';
import { KerberosKeytabsListComponent } from './kerberoskeytabs/kerberoskeytabs-list.component';
import { KerberosRealmsListComponent } from './kerberosrealms/kerberosrealms-list.component';
import { KerberosSettingsComponent } from './kerberossettings/kerberossettings.component';
import { LdapComponent } from './ldap/ldap.component';
import { NISComponent } from './nis';

export const routes: Routes = [{
  path: '',
  data: { title: 'Directory Services' },
  children: [
    {
      path: '',
      component: DirectoryservicesComponent,
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
