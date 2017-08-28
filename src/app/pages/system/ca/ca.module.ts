import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';

import {EntityModule} from '../../common/entity/entity.module';

import {CertificateAuthorityDeleteComponent} from './ca-delete/';
import {CertificateAuthorityImportComponent} from './ca-import/';
import {CertificateAuthorityIntermediateComponent} from './ca-intermediate/';
import {CertificateAuthorityInternalComponent} from './ca-internal/';
import {CertificateAuthorityListComponent} from './ca-list/';
import {routing} from './ca.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing
  ],
  declarations : [
    CertificateAuthorityListComponent,
    CertificateAuthorityImportComponent,
    CertificateAuthorityInternalComponent,
    CertificateAuthorityIntermediateComponent,
    CertificateAuthorityDeleteComponent,
  ],
  providers : []
})
export class CertificateAuthorityModule {
}