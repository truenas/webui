import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../../common/entity/entity.module';
import { CommonFormComponent } from '../../common/form/';
import { routing } from './certificate.routing';


import { CertificateEditComponent } from './certificate-edit/';
import { CertificateListComponent } from './certificate-list';
import { CertificateDeleteComponent } from './certificate-delete/';
import { CertificateImportComponent } from './certificate-import/';
import { CertificateInternalComponent } from './certificate-internal/';
import { CertificateCSRComponent } from './certificate-csr/';

@NgModule({
  imports: [
    EntityModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    NgUploaderModule,
    routing
  ],
  declarations: [
    CertificateListComponent,
    CertificateDeleteComponent,
    CertificateEditComponent,
    CertificateImportComponent,
    CertificateInternalComponent,
    CertificateCSRComponent,
  ],
  providers: [
  ]
})
export class CertificateModule { }
