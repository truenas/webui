import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { OauthButtonModule } from 'app/modules/oauth-button/oauth-button.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import {
  CloudCredentialsFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { OauthProviderComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import { BackblazeB2ProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';
import {
  StorjProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import { TokenProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/token-provider-form/token-provider-form.component';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { SshKeypairCardComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.component';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { AcmeDnsAuthenticatorListComponent } from 'app/pages/credentials/certificates-dash/acme-dns-authenticator-list/acme-dns-authenticator-list.component';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import {
  CaImportComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/steps/ca-import/ca-import.component';
import {
  CertificateDetailsComponent,
} from 'app/pages/credentials/certificates-dash/certificate-details/certificate-details.component';
import { ConfirmForceDeleteCertificateComponent } from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import {
  CsrImportComponent,
} from 'app/pages/credentials/certificates-dash/csr-add/steps/csr-import/csr-import.component';
import { CertificateSigningRequestsListComponent } from 'app/pages/credentials/certificates-dash/csr-list/csr-list.component';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';
import {
  CertificateAddComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/certificate-add.component';
import {
  CertificateImportComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-import/certificate-import.component';
import {
  SignCsrDialogComponent,
} from 'app/pages/credentials/certificates-dash/sign-csr-dialog/sign-csr-dialog.component';
import {
  ViewCertificateDialogComponent,
} from 'app/pages/credentials/certificates-dash/view-certificate-dialog/view-certificate-dialog.component';
import { routing } from 'app/pages/credentials/credentials.routing';
import { KmipComponent } from 'app/pages/credentials/kmip/kmip.component';
import { BackupCredentialsComponent } from './backup-credentials/backup-credentials.component';
import { CloudCredentialsCardComponent } from './backup-credentials/cloud-credentials-card/cloud-credentials-card.component';
import { AzureProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/azure-provider-form/azure-provider-form.component';
import { FtpProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';
import { GoogleCloudProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/google-cloud-provider-form/google-cloud-provider-form.component';
import { GoogleDriveProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/google-drive-provider-form/google-drive-provider-form.component';
import { HttpProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/http-provider-form/http-provider-form.component';
import { MegaProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/mega-provider-form/mega-provider-form.component';
import { OneDriveProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/one-drive-provider-form/one-drive-provider-form.component';
import { OpenstackSwiftProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/openstack-swift-provider-form/openstack-swift-provider-form.component';
import { PcloudProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/pcloud-provider-form/pcloud-provider-form.component';
import { S3ProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';
import { SftpProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/sftp-provider-form/sftp-provider-form.component';
import { WebdavProviderFormComponent } from './backup-credentials/cloud-credentials-form/provider-forms/webdav-provider-form/webdav-provider-form.component';
import { SshConnectionCardComponent } from './backup-credentials/ssh-connection-card/ssh-connection-card.component';
import { CertificateAuthorityAddComponent } from './certificates-dash/certificate-authority-add/certificate-authority-add.component';
import { CaIdentifierAndTypeComponent } from './certificates-dash/certificate-authority-add/steps/ca-identifier-and-type/ca-identifier-and-type.component';
import { CertificateAuthorityEditComponent } from './certificates-dash/certificate-authority-edit/certificate-authority-edit.component';
import { CertificateAuthorityListComponent } from './certificates-dash/certificate-authority-list/certificate-authority-list.component';
import { CertificateEditComponent } from './certificates-dash/certificate-edit/certificate-edit.component';
import { CertificateListComponent } from './certificates-dash/certificate-list/certificate-list.component';
import { CertificatesDashComponent } from './certificates-dash/certificates-dash.component';
import { CsrAddComponent } from './certificates-dash/csr-add/csr-add.component';
import { CsrIdentifierAndTypeComponent } from './certificates-dash/csr-add/steps/csr-identifier-and-type/csr-identifier-and-type.component';
import { CertificateIdentifierAndTypeComponent } from './certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';
import { CertificateConstraintsComponent } from './certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import { CertificateOptionsComponent } from './certificates-dash/forms/common-steps/certificate-options/certificate-options.component';
import { CertificateSubjectComponent } from './certificates-dash/forms/common-steps/certificate-subject/certificate-subject.component';

@NgModule({
  declarations: [
    BackupCredentialsComponent,
    SshConnectionFormComponent,
    SshKeypairFormComponent,
    CertificatesDashComponent,
    CertificateAuthorityAddComponent,
    CertificateAuthorityEditComponent,
    CertificateEditComponent,
    ConfirmForceDeleteCertificateComponent,
    AcmednsFormComponent,
    SignCsrDialogComponent,
    ViewCertificateDialogComponent,
    CertificateDetailsComponent,
    KmipComponent,
    CloudCredentialsFormComponent,
    S3ProviderFormComponent,
    BackblazeB2ProviderFormComponent,
    FtpProviderFormComponent,
    GoogleCloudProviderFormComponent,
    GoogleDriveProviderFormComponent,
    HttpProviderFormComponent,
    TokenProviderFormComponent,
    MegaProviderFormComponent,
    AzureProviderFormComponent,
    OneDriveProviderFormComponent,
    OpenstackSwiftProviderFormComponent,
    PcloudProviderFormComponent,
    SftpProviderFormComponent,
    WebdavProviderFormComponent,
    StorjProviderFormComponent,
    OauthProviderComponent,
    CertificateAcmeAddComponent,
    CertificateOptionsComponent,
    CertificateSubjectComponent,
    CertificateAddComponent,
    CertificateIdentifierAndTypeComponent,
    CertificateConstraintsComponent,
    CertificateImportComponent,
    CaIdentifierAndTypeComponent,
    CaImportComponent,
    CsrAddComponent,
    CsrIdentifierAndTypeComponent,
    CsrImportComponent,
    CertificateListComponent,
    CertificateSigningRequestsListComponent,
    CertificateAuthorityListComponent,
    AcmeDnsAuthenticatorListComponent,
    SshConnectionCardComponent,
    SshKeypairCardComponent,
    CloudCredentialsCardComponent,
  ],
  imports: [
    AppCommonModule,
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EntityModule,
    LayoutModule,
    FlexLayoutModule,
    IxDynamicFormModule,
    IxIconModule,
    IxTable2Module,
    MatButtonModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatMenuModule,
    MatProgressBarModule,
    MatStepperModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    RouterModule,
    routing,
    TestIdModule,
    TranslateModule,
    OauthButtonModule,
  ],
})
export class CredentialsModule { }
