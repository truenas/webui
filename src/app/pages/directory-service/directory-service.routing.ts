import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { DirectoryServicesComponent } from 'app/pages/directory-service/directory-services.component';
import { IdmapListComponent } from './components/idmap-list/idmap-list.component';
import { LdapComponent } from './components/ldap/ldap.component';

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
      path: 'idmap',
      component: IdmapListComponent,
      data: { title: 'Idmap', breadcrumb: 'Idmap' },
    }, {
      path: 'kerberosrealms',
      component: KerberosRealmsListComponent,
      data: { title: 'Kerberos Realms', breadcrumb: 'Kerberos Realms', icon: 'apps' },
    }, {
      path: 'kerberoskeytabs',
      component: KerberosKeytabsListComponent,
      data: { title: 'Kerberos Keytab', breadcrumb: 'Kerberos Keytab', icon: 'apps' },
    }],
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
