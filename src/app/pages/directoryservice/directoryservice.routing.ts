import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ActiveDirectoryComponent} from './activedirectory/';
import {LdapComponent} from './ldap/';
import {NISComponent} from './nis/';

export const routes: Routes = [
  {path : 'ldap', component : LdapComponent},
  {path : 'activedirectory', component : ActiveDirectoryComponent},
  {path : 'nis', component : NISComponent}
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
