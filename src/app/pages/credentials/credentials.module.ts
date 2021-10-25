import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { EntityModule } from '../common/entity/entity.module';
import { BackupCredentialsComponent } from './backup-credentials/backup-credentials.component';
import { CloudCredentialsFormComponent } from './backup-credentials/forms/cloud-credentials-form.component';
import { SshConnectionsFormComponent } from './backup-credentials/forms/ssh-connections-form.component';
import { CertificatesDashComponent } from './certificates-dash/certificates-dash.component';
import { AcmednsFormComponent } from './certificates-dash/forms/acmedns-form.component';
import { CertificateAuthorityAddComponent } from './certificates-dash/forms/ca-add.component';
import { CertificateAuthorityEditComponent } from './certificates-dash/forms/ca-edit.component';
import { CertificateAcmeAddComponent } from './certificates-dash/forms/certificate-acme-add.component';
import { CertificateAddComponent } from './certificates-dash/forms/certificate-add.component';
import { CertificateEditComponent } from './certificates-dash/forms/certificate-edit.component';

@NgModule({
  declarations: [
    BackupCredentialsComponent,
    SshConnectionsFormComponent,
    CloudCredentialsFormComponent,
    SshKeypairFormComponent,
    CertificatesDashComponent,
    CertificateAcmeAddComponent,
    CertificateAddComponent,
    CertificateAuthorityAddComponent,
    CertificateAuthorityEditComponent,
    CertificateAcmeAddComponent,
    CertificateEditComponent,
    AcmednsFormComponent,
  ],
  imports: [
    CommonModule,
    MatCardModule,
    FlexLayoutModule,
    MatDividerModule,
    TranslateModule,
    EntityModule,
    MaterialModule,
    CommonDirectivesModule,
    IxFormsModule,
    ReactiveFormsModule,
  ],
})
export class CredentialsModule { }
