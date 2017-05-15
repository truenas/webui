import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TunableListComponent } from './tunable-list/';
import { TunableAddComponent } from './tunable-add/';
import { TunableDeleteComponent } from './tunable-delete/';

export const routes: Routes = [
  { path: 'add', component: TunableAddComponent },
  // { path: 'internal', component: CertificateInternalComponent },
  // { path: 'csr', component: CertificateCSRComponent },
  // { path: 'edit/:pk', component: CertificateEditComponent },
  { path: 'delete/:pk', component: TunableDeleteComponent },
  { path: '', component: TunableListComponent, pathMatch: 'full' },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);