import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ActiveDirectoryComponent } from './activedirectory/';
import { LdapComponent } from './ldap/';
import { NISComponent } from './nis/';
import { IdmapComponent } from './idmap';
import { KerberosRealmsListComponent } from './kerberosrealms/kerberosrealms-list';
import { KerberosRealmsFormComponent } from './kerberosrealms/kerberosrealms-form';
import { KerberosSettingsComponent } from './kerberossettings';

export const routes: Routes = [{
  path: '',
  data: { title: 'Directory Service' },
  children: [{
    path: 'ldap',
    component: LdapComponent,
    data: { title: 'LDAP', breadcrumb: 'LDAP' }
  }, {
    path: 'activedirectory',
    component: ActiveDirectoryComponent,
    data: { title: 'Actived Directory', breadcrumb: 'Actived Directory' }
  }, {
    path: 'nis',
    component: NISComponent,
    data: { title: 'NIS', breadcrumb: 'NIS' }
  }, {
    path: 'idmap/:pk/:service',
    data: { title: 'Idmap', breadcrumb: 'Idmap' },
    component: IdmapComponent,
  }, {
    path: 'kerberosrealms',
    data: { title: 'Kerberos Realms', breadcrumb: 'Kerberos Realms' },
    children: [{
      path: '',
      component: KerberosRealmsListComponent,
      data: { title: 'Kerberos Realms', breadcrumb: 'Kerberos Realms' }
    }, {
      path: 'add',
      component: KerberosRealmsFormComponent,
      data: { title: 'Add', breadcrumb: 'Add'},
    }, {
      path: 'edit/:pk',
      component: KerberosRealmsFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit'},
    }]
  }, {
    path: 'kerberossettings',
    data : { title: 'Kerberos Settings', breadcrumb: 'Kerberos Settings'},
    component: KerberosSettingsComponent,
  }]
}];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
