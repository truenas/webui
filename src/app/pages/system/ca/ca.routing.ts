import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {CertificateAuthorityDeleteComponent} from './ca-delete/';
import {CertificateAuthorityImportComponent} from './ca-import/';
import {CertificateAuthorityIntermediateComponent} from './ca-intermediate/';
import {CertificateAuthorityInternalComponent} from './ca-internal/';
import {CertificateAuthorityListComponent} from './ca-list/';

export const routes: Routes = [
  {path : 'import', component : CertificateAuthorityImportComponent},
  {path : 'internal', component : CertificateAuthorityInternalComponent},
  {
    path : 'intermediate',
    component : CertificateAuthorityIntermediateComponent
  },
  {path : 'delete/:pk', component : CertificateAuthorityDeleteComponent},
  {
    path : '',
    component : CertificateAuthorityListComponent,
    pathMatch : 'full'
  },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);