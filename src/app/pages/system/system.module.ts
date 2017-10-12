import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgUploaderModule } from 'ngx-uploader';

import { EntityModule } from '../common/entity/entity.module';

import { MaterialModule } from '@angular/material';
import { routing } from './system.routing';

import { GeneralComponent } from './general/general.component';
import { ConfigSaveComponent } from './general/config-save/config-save.component';
import { ConfigUploadComponent } from './general/config-upload/config-upload.component';
import { ConfigResetComponent } from './general/config-reset/config-reset.component';
import { AdvancedComponent } from './advanced/';
import { BootEnvironmentCloneComponent } from './bootenv/bootenv-clone/';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/';
import { TunableListComponent } from './tunable/tunable-list/';
import { TunableFormComponent } from './tunable/tunable-form/';
import { UpdateComponent } from './update/';
import { NTPServerAddComponent } from './ntpservers/ntpserver-add/';
import { NTPServerEditComponent } from './ntpservers/ntpserver-edit/';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { CloudCredentialsGCSComponent } from './CloudCredentials/CloudCredentials-gcs/';
import { CloudCredentialsListComponent } from './CloudCredentials/CloudCredentials-list/';
import { CertificateAuthorityImportComponent } from './ca/ca-import/';
import { CertificateAuthorityIntermediateComponent } from './ca/ca-intermediate/';
import { CertificateAuthorityInternalComponent } from './ca/ca-internal/';
import { CertificateAuthorityListComponent } from './ca/ca-list/';
import { CAFormComponent } from './ca/ca-form/';
import { CertificateCSRComponent } from './certificates/certificate-csr/';
import { CertificateEditComponent } from './certificates/certificate-edit/';
import { CertificateImportComponent } from './certificates/certificate-import/';
import { CertificateInternalComponent } from './certificates/certificate-internal/';
import { CertificateListComponent } from './certificates/certificate-list';
import { SupportComponent } from './support/support.component';
import { AlertServiceAddAWSComponent } from 'app/pages/system/alertservice/alertservice-add-aws/alertservice-add-aws.component';
import { AlertServiceEditAWSComponent } from 'app/pages/system/alertservice/alertservice-edit-aws/alertservice-edit-aws.component';
import { AlertServiceAddHipchatComponent } from 'app/pages/system/alertservice/alertservice-add-hipchat/alertservice-add-hipchat.component';
import { AlertServiceEditHipchatComponent } from 'app/pages/system/alertservice/alertservice-edit-hipchat/alertservice-edit-hipchat.component';
import { AlertServiceAddInfluxdbComponent } from 'app/pages/system/alertservice/alertservice-add-influxdb/alertservice-add-influxdb.component';
import { AlertServiceEditInfluxdbComponent } from 'app/pages/system/alertservice/alertservice-edit-influxdb/alertservice-edit-influxdb.component';
import { AlertServiceEditMattermostComponent } from 'app/pages/system/alertservice/alertservice-edit-mattermost';
import { AlertServiceAddMattermostComponent } from 'app/pages/system/alertservice/alertservice-add-mattermost';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing,
    MaterialModule
  ],
  declarations: [
    GeneralComponent,
    ConfigUploadComponent,
    ConfigResetComponent,
    ConfigSaveComponent,
    AdvancedComponent,
    BootEnvironmentListComponent,
    BootEnvironmentCloneComponent,
    TunableListComponent,
    TunableFormComponent,
    UpdateComponent,
    NTPServerListComponent,
    NTPServerAddComponent,
    NTPServerEditComponent,
    AlertServiceAddAWSComponent,
    AlertServiceEditAWSComponent,
    AlertServiceAddHipchatComponent,
    AlertServiceEditHipchatComponent,
    AlertServiceAddInfluxdbComponent,
    AlertServiceEditInfluxdbComponent,
    AlertServiceAddMattermostComponent,
    AlertServiceEditMattermostComponent,
    AlertServiceListComponent,
    CloudCredentialsGCSComponent,
    CloudCredentialsListComponent,
    CAFormComponent,
    CertificateAuthorityListComponent,
    CertificateAuthorityImportComponent,
    CertificateAuthorityInternalComponent,
    CertificateAuthorityIntermediateComponent,
    CertificateListComponent,
    CertificateEditComponent,
    CertificateImportComponent,
    CertificateInternalComponent,
    CertificateCSRComponent,
    SupportComponent
  ],
  providers: []
})
export class SystemModule {}
