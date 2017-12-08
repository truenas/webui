import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ActiveDirectoryComponent } from './activedirectory/';
import { LdapComponent } from './ldap/';
import { NISComponent } from './nis/';
import { IdmapAdComponent } from './idmap/ad/';

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
    path: 'idmap/:service',
    data: { title: 'Idmap', breadcrumb: 'Idmap' },
    children: [{
      path: 'ad',
      component: IdmapAdComponent,
      data: { title: 'AD', breadcrumb: 'AD' }
    }]
  }]
}];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
