import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LdapComponent } from './ldap/';
import { ActiveDirectoryComponent } from './activedirectory/';
import { NISComponent } from './nis/';
import { NT4Component } from './nt4/';

export const routes: Routes = [
  { path: 'ldap', component: LdapComponent },
  { path: 'activedirectory', component: ActiveDirectoryComponent },
  { path: 'nis', component: NISComponent },
  { path: 'nt4', component: NT4Component }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
