import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {CertificateCSRComponent} from './certificate-csr/';
import {CertificateDeleteComponent} from './certificate-delete/';
import {CertificateEditComponent} from './certificate-edit/';
import {CertificateImportComponent} from './certificate-import/';
import {CertificateInternalComponent} from './certificate-internal/';
import {CertificateListComponent} from './certificate-list/';

export const routes: Routes = [
  {path : 'import', component : CertificateImportComponent},
  {path : 'internal', component : CertificateInternalComponent},
  {path : 'csr', component : CertificateCSRComponent},
  {path : 'edit/:pk', component : CertificateEditComponent},
  {path : 'delete/:pk', component : CertificateDeleteComponent},
  {path : '', component : CertificateListComponent, pathMatch : 'full'},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);