import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../common/entity/entity.module';

import { MaterialModule } from '../../appMaterial.module';
import { MarkdownModule } from 'ngx-markdown';
import { routing } from './system.routing';
import { FlexLayoutModule } from '@angular/flex-layout';

import { GeneralComponent } from './general/general.component';
import { AdvancedComponent } from './advanced/';
import { DatasetComponent } from './dataset/';
import { BootEnvironmentCloneComponent } from './bootenv/bootenv-clone/';
import { BootEnvironmentRenameComponent } from './bootenv/bootenv-rename/';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/';
import { BootEnvironmentCreateComponent } from './bootenv/bootenv-create';
import { BootEnvReplaceFormComponent } from './bootenv/bootenv-replace';
import { BootStatusListComponent } from './bootenv/bootenv-status/';
import { BootEnvAttachFormComponent } from './bootenv/bootenv-attach';
import { TunableListComponent } from './tunable/tunable-list/';
import { TunableFormComponent } from './tunable/tunable-form/';
import { UpdateComponent } from './update/';
import { ManualUpdateComponent } from './update/manualupdate/';
import { NTPServerFormComponent } from './ntpservers/ntpserver-form/';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { CloudCredentialsListComponent } from './CloudCredentials/CloudCredentials-list/';
import { CloudCredentialsFormComponent } from './CloudCredentials/cloudcredentials-form/';
import { SshConnectionsListComponent } from './ssh-connections/ssh-connections-list/ssh-connections-list.component';
import { SshConnectionsFormComponent } from './ssh-connections/ssh-connections-form/ssh-connections-form.component';
import { SshKeypairsListComponent } from './ssh-keypairs/ssh-keypairs-list/ssh-keypairs-list.component';
import { SshKeypairsFormComponent } from './ssh-keypairs/ssh-keypairs-form/ssh-keypairs-form.component';
import { CertificateAuthorityListComponent } from './ca/ca-list/';
import { CertificateAuthorityAddComponent } from './ca/ca-add/';
import { CertificateAuthorityEditComponent } from './ca/ca-edit/';
import { CertificateAuthoritySignComponent } from './ca/ca-sign/';
import { CertificateEditComponent } from './certificates/certificate-edit/';
import { CertificateListComponent } from './certificates/certificate-list';
import { CertificateAddComponent } from './certificates/certificate-add';
import { SupportComponent } from './support/support.component';
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { TranslateModule } from '@ngx-translate/core';
import { EmailComponent } from './email';
import { AlertServiceComponent } from './alertservice/alert-service/alert-service.component';
import { AlertConfigComponent } from './alert/alert.component';
import { AcmednsListComponent } from './acmedns/acmedns-list/acmedns-list.component';
import { AcmednsFormComponent } from './acmedns/acmedns-add/acmedns-form.component';
import { CertificateAcmeAddComponent } from './certificates/certificate-acme-add/certificate-acme-add.component';
import { FailoverComponent } from './failover/failover.component';
import { ReportingComponent } from './reporting/reporting.component';
import { EnclosureModule } from './viewenclosure/enclosure.module';
import { EulaComponent } from './support/eula/eula.component';
import { TnSysInfoComponent } from './support/tn-sys-info/tn-sys-info.component';
import { SysImageComponent } from './support/sys-image/sys-image.component';
import { ProductionStatusComponent } from './support/production-status/production-status.component';
import { ProactiveComponent } from './support/proactive/proactive.component';
import { TnSupportComponent } from './support/tn-support/tn-support.component';
import { FnSupportComponent } from './support/fn-support/fn-support.component';
import { FnSysInfoComponent } from './support/fn-sys-info/fn-sys-info.component'


@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing,
    MaterialModule, MarkdownModule.forRoot(), TranslateModule, FlexLayoutModule,
    EnclosureModule
  ],
  declarations: [
    GeneralComponent,
    AdvancedComponent,
    DatasetComponent,
    BootEnvironmentListComponent,
    BootEnvironmentCloneComponent,
    BootEnvironmentRenameComponent,
    BootEnvironmentCreateComponent,
    BootStatusListComponent,
    BootEnvAttachFormComponent,
    BootEnvReplaceFormComponent,
    TunableListComponent,
    TunableFormComponent,
    UpdateComponent,
    ManualUpdateComponent,
    NTPServerListComponent,
    NTPServerFormComponent,
    AlertServiceListComponent,
    CloudCredentialsListComponent,
    CloudCredentialsFormComponent,
    SshConnectionsListComponent,
    SshConnectionsFormComponent,
    SshKeypairsListComponent,
    SshKeypairsFormComponent,
    CertificateAuthorityListComponent,
    CertificateAuthorityAddComponent,
    CertificateAuthorityEditComponent,
    CertificateAuthoritySignComponent,
    CertificateListComponent,
    CertificateAddComponent,
    CertificateEditComponent,
    SupportComponent,
    EmailComponent,
    AlertServiceComponent,
    AlertConfigComponent,
    AcmednsListComponent,
    AcmednsFormComponent,
    CertificateAcmeAddComponent,
    FailoverComponent,
    ReportingComponent,
    EulaComponent,
    TnSysInfoComponent,
    SysImageComponent,
    ProductionStatusComponent,
    ProactiveComponent,
    TnSupportComponent,
    FnSupportComponent,
    FnSysInfoComponent,
  ],
  providers: []
})
export class SystemModule {}
