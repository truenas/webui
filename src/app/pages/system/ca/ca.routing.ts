import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CertificateAuthorityListComponent } from './ca-list/';
import { CertificateAuthorityImportComponent } from './ca-import/';
import { CertificateAuthorityInternalComponent } from './ca-internal/';
import { CertificateAuthorityIntermediateComponent } from './ca-intermediate/';
import { CertificateAuthorityDeleteComponent } from './ca-delete/';


export const routes: Routes = [
  { path: 'import', component: CertificateAuthorityImportComponent },
  { path: 'internal', component: CertificateAuthorityInternalComponent },
  { path: 'intermediate', component: CertificateAuthorityIntermediateComponent },
  { path: 'delete/:pk', component: CertificateAuthorityDeleteComponent },
  { path: '', component: CertificateAuthorityListComponent, pathMatch: 'full' },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);