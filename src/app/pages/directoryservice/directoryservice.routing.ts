import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LdapComponent } from './ldap/';
import { ActiveDirectoryComponent } from './activedirectory/';
import { NISComponent } from './nis/';

export const routes: Routes = [
  { path: 'ldap', component: LdapComponent },
  { path: 'activedirectory', component: ActiveDirectoryComponent },
  { path: 'nis', component: NISComponent }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
