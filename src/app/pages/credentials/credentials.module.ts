import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDividerModule } from "@angular/material/divider";
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from '../common/entity/entity.module';
import { MaterialModule } from '../../appMaterial.module';
import { CommonDirectivesModule } from '../../directives/common/common-directives.module';

import { BackupCredentialsComponent } from './backup-credentials/backup-credentials.component';
import { SshConnectionsFormComponent } from './backup-credentials/forms/ssh-connections-form.component';
import { CloudCredentialsFormComponent } from './backup-credentials/forms/cloud-credentials-form.component';
import { SshKeypairsFormComponent } from './backup-credentials/forms/ssh-keypairs-form.component';
import { CertificatesDashComponent } from './certificates-dash/certificates-dash.component';

import { CertificateEditComponent } from './certificates-dash/forms/certificate-edit.component';
import { CertificateAddComponent } from './certificates-dash/forms/certificate-add.component';
import { CertificateAuthorityAddComponent } from './certificates-dash/forms/ca-add.component';
import { CertificateAuthorityEditComponent } from './certificates-dash/forms/ca-edit.component';
import { CertificateAcmeAddComponent } from './certificates-dash/forms/certificate-acme-add.component';
import { AcmednsFormComponent } from './certificates-dash/forms/acmedns-form.component'

@NgModule({
  declarations: [ BackupCredentialsComponent, SshConnectionsFormComponent, 
    CloudCredentialsFormComponent, SshKeypairsFormComponent, CertificatesDashComponent, CertificateAcmeAddComponent,
    CertificateAddComponent, CertificateAuthorityAddComponent, CertificateAuthorityEditComponent,
    CertificateAcmeAddComponent, CertificateEditComponent, AcmednsFormComponent ],
  imports: [
    CommonModule,
    MatCardModule,
    FlexLayoutModule,
    MatDividerModule,
    TranslateModule,
    EntityModule,
    MaterialModule,
    CommonDirectivesModule
  ]
})
export class CredentialsModule { }
