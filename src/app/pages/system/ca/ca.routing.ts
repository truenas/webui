import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CertificateAuthorityListComponent } from './ca-list/';


export const routes: Routes = [
  // { path: 'import', component: CertificateImportComponent },
  // { path: 'internal', component: CertificateInternalComponent },
  // { path: 'csr', component: CertificateCSRComponent },
  // { path: 'edit/:pk', component: CertificateEditComponent },
  // { path: 'delete/:pk', component: CertificateDeleteComponent },
  { path: '', component: CertificateAuthorityListComponent, pathMatch: 'full' },
  // { path: ':pk/devices/:name/cdrom/add', component: DeviceCdromAddComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);