import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';
import { EntityModule } from '../../modules/entity/entity.module';
import { BackupCredentialsComponent } from './backup-credentials/backup-credentials.component';
import { CloudCredentialsFormComponent } from './backup-credentials/forms/cloud-credentials-form.component';
import { SshConnectionsFormComponent } from './backup-credentials/forms/ssh-connections-form.component';
import { CertificatesDashComponent } from './certificates-dash/certificates-dash.component';
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
    MatButtonModule,
    FlexLayoutModule,
    MatDividerModule,
    TranslateModule,
    MatIconModule,
    MatMenuModule,
    EntityModule,
    CommonDirectivesModule,
    IxFormsModule,
    ReactiveFormsModule,
  ],
})
export class CredentialsModule { }
