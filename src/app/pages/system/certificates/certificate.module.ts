import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';

import {EntityModule} from '../../common/entity/entity.module';

import {CertificateCSRComponent} from './certificate-csr/';
import {CertificateDeleteComponent} from './certificate-delete/';
import {CertificateEditComponent} from './certificate-edit/';
import {CertificateImportComponent} from './certificate-import/';
import {CertificateInternalComponent} from './certificate-internal/';
import {CertificateListComponent} from './certificate-list';
import {routing} from './certificate.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing
  ],
  declarations : [
    CertificateListComponent,
    CertificateDeleteComponent,
    CertificateEditComponent,
    CertificateImportComponent,
    CertificateInternalComponent,
    CertificateCSRComponent,
  ],
  providers : []
})
export class CertificateModule {
}
