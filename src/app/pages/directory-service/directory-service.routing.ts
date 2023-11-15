import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import IdmapListComponent from 'app/pages/directory-service/components/idmap-list/idmap-list.component';
import KerberosKeytabsListComponent from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import KerberosRealmsListComponent from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { LdapComponent } from './components/ldap/ldap.component';

export const routes: Routes = [{
  path: '',
  data: { title: T('Directory Services') },
  children: [
    {
      path: '',
      redirectTo: '/credentials/directory-services',
      pathMatch: 'full',
    }, {
      path: 'ldap',
      component: LdapComponent,
      data: { title: T('LDAP'), breadcrumb: null, icon: 'device_hub' },
    }, {
      path: 'activedirectory',
      component: ActiveDirectoryComponent,
      data: { title: T('Active Directory'), breadcrumb: null, icon: 'apps' },
    }, {
      path: 'idmap',
      component: IdmapListComponent,
      data: { title: T('Idmap'), breadcrumb: null },
    }, {
      path: 'kerberosrealms',
      component: KerberosRealmsListComponent,
      data: { title: T('Kerberos Realms'), breadcrumb: null, icon: 'apps' },
    }, {
      path: 'kerberoskeytabs',
      component: KerberosKeytabsListComponent,
      data: { title: T('Kerberos Keytab'), breadcrumb: null, icon: 'apps' },
    }],
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
