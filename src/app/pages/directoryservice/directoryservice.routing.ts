import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ActiveDirectoryComponent } from './activedirectory/';
import { LdapComponent } from './ldap/';
import { NISComponent } from './nis/';
import { KerberosRealmsListComponent } from './kerberosrealms/kerberosrealms-list';
import { KerberosRealmsFormComponent } from './kerberosrealms/kerberosrealms-form';
import { KerberosSettingsComponent } from './kerberossettings';
import { KerberosKeytabsListComponent } from './kerberoskeytabs/kerberoskeytabs-list';
import { KerberosKeytabsFormComponent } from './kerberoskeytabs/kerberoskeytabs-form';
import { IdmapListComponent } from './idmap-list';
import { IdmapFormComponent } from './idmap-form';
import { EntityDashboardComponent } from '../common/entity/entity-dashboard/entity-dashboard.component';

export const routes: Routes = [{
  path: '',
  data: { title: 'Directory Services' },
  children: [
    {
      path: '',
      component: EntityDashboardComponent,
    },
  {
    path: 'ldap',
    component: LdapComponent,
    data: { title: 'LDAP', breadcrumb: 'LDAP', icon: 'device_hub' }
  }, {
    path: 'activedirectory',
    component: ActiveDirectoryComponent,
    data: { title: 'Active Directory', breadcrumb: 'Active Directory', icon: 'apps' }
  }, {
    path: 'nis',
    component: NISComponent,
    data: { title: 'NIS', breadcrumb: 'NIS', icon: 'library_books' }
  }, {
    path: 'idmap',
    data: { title: 'Idmap', breadcrumb: 'Idmap' },
    children: [{
      path: '',
      component: IdmapListComponent,
      data: { title: 'Idmap', breadcrumb: 'Idmap'}
    },
    {
      path: 'add',
      component: IdmapFormComponent,
      data: { title: 'Idmap Add', breadcrumb: 'Idmap Add'}
    },
    {
      path: 'edit/:pk',
      component: IdmapFormComponent,
      data: { title: 'Idmap Edit', breadcrumb: 'Idmap Edit' },
    }  
    ]
  }, {
    path: 'kerberosrealms',
    data: { title: 'Kerberos Realms', breadcrumb: 'Kerberos Realms', icon: 'apps' },
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
    data : { title: 'Kerberos Settings', breadcrumb: 'Kerberos Settings', icon: 'settings'},
    component: KerberosSettingsComponent,
  }, {
    path: 'kerberoskeytabs',
    data: { title: 'Kerberos Keytab', breadcrumb: 'Kerberos Keytab', icon: 'apps' },
    children: [{
      path: '',
      component: KerberosKeytabsListComponent,
      data: { title: 'Kerberos Keytab', breadcrumb: 'Kerberos Keytab' }
    }, {
      path: 'add',
      component: KerberosKeytabsFormComponent,
      data: { title: 'Add', breadcrumb: 'Add'},
    }, {
      path: 'edit/:pk',
      component: KerberosKeytabsFormComponent,
      data: { title: 'Edit', breadcrumb: 'Edit'},
    }]
  }]
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
