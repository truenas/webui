import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LdapComponent } from './ldap/';

export const routes: Routes = [
  { path: 'ldap', component: LdapComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
