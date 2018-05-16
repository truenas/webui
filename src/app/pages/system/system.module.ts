import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../common/entity/entity.module';

import { MaterialModule } from '../../appMaterial.module';
import { MarkdownModule } from 'angular2-markdown';
import { routing } from './system.routing';
import { FlexLayoutModule } from '@angular/flex-layout';

import { GeneralComponent } from './general/general.component';
import { ConfigSaveComponent } from './general/config-save/config-save.component';
import { ConfigUploadComponent } from './general/config-upload/config-upload.component';
import { ConfigResetComponent } from './general/config-reset/config-reset.component';
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
import {ManualUpdateConfigSaveComponent} from './update/manualupdate/manualupdateconfig-save/';
import { NTPServerAddComponent } from './ntpservers/ntpserver-add/';
import { NTPServerEditComponent } from './ntpservers/ntpserver-edit/';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { CloudCredentialsListComponent } from './CloudCredentials/CloudCredentials-list/';
import { CloudCredentialsFormComponent } from './CloudCredentials/cloudcredentials-form/';
import { CertificateAuthorityListComponent } from './ca/ca-list/';
import { CertificateAuthorityAddComponent } from './ca/ca-add/';
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

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing,
    MaterialModule, MarkdownModule.forRoot(), TranslateModule, FlexLayoutModule
  ],
  declarations: [
    GeneralComponent,
    ConfigUploadComponent,
    ConfigResetComponent,
    ConfigSaveComponent,
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
    ManualUpdateConfigSaveComponent,
    NTPServerListComponent,
    NTPServerAddComponent,
    NTPServerEditComponent,
    AlertServiceListComponent,
    CloudCredentialsListComponent,
    CloudCredentialsFormComponent,
    CertificateAuthorityListComponent,
    CertificateAuthorityAddComponent,
    CertificateAuthoritySignComponent,
    CertificateListComponent,
    CertificateAddComponent,
    CertificateEditComponent,
    SupportComponent,
    EmailComponent,
    AlertServiceComponent,
    AlertConfigComponent,
  ],
  providers: []
})
export class SystemModule {}
