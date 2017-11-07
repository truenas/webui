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
import { BootEnvironmentRenameComponent } from './bootenv/bootenv-rename/';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/';
import { TunableListComponent } from './tunable/tunable-list/';
import { TunableFormComponent } from './tunable/tunable-form/';
import { UpdateComponent } from './update/';
import { NTPServerAddComponent } from './ntpservers/ntpserver-add/';
import { NTPServerEditComponent } from './ntpservers/ntpserver-edit/';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { CloudCredentialsGCSComponent } from './CloudCredentials/CloudCredentials-gcs/';
import { CloudCredentialsB2Component } from './CloudCredentials/CloudCredentials-B2/';
import { CloudCredentialsAmazonComponent } from './CloudCredentials/CloudCredentials-amazon/';
import { CloudCredentialsListComponent } from './CloudCredentials/CloudCredentials-list/';
import { CloudCredentialsDeleteComponent } from './CloudCredentials/CloudCredentials-delete/';
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
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { AlertServiceAddAWSComponent } from 'app/pages/system/alertservice/alertservice-add-aws/alertservice-add-aws.component';
import { AlertServiceEditAWSComponent } from 'app/pages/system/alertservice/alertservice-edit-aws/alertservice-edit-aws.component';
import { AlertServiceAddHipchatComponent } from 'app/pages/system/alertservice/alertservice-add-hipchat/alertservice-add-hipchat.component';
import { AlertServiceEditHipchatComponent } from 'app/pages/system/alertservice/alertservice-edit-hipchat/alertservice-edit-hipchat.component';
import { AlertServiceAddInfluxdbComponent } from 'app/pages/system/alertservice/alertservice-add-influxdb/alertservice-add-influxdb.component';
import { AlertServiceEditInfluxdbComponent } from 'app/pages/system/alertservice/alertservice-edit-influxdb/alertservice-edit-influxdb.component';
import { AlertServiceEditMattermostComponent } from 'app/pages/system/alertservice/alertservice-edit-mattermost';
import { AlertServiceAddMattermostComponent } from 'app/pages/system/alertservice/alertservice-add-mattermost';
import { AlertServiceEditVictoropsComponent } from 'app/pages/system/alertservice/alertservice-edit-victorops';
import { AlertServiceAddVictoropsComponent } from 'app/pages/system/alertservice/alertservice-add-victorops';
import { AlertServiceEditSlackComponent } from 'app/pages/system/alertservice/alertservice-edit-slack';
import { AlertServiceAddSlackComponent } from 'app/pages/system/alertservice/alertservice-add-slack';
import { AlertServiceEditPagerdutyComponent } from 'app/pages/system/alertservice/alertservice-edit-pagerduty';
import { AlertServiceAddPagerdutyComponent } from 'app/pages/system/alertservice/alertservice-add-pagerduty';
import { AlertServiceEditOpsgenieComponent } from 'app/pages/system/alertservice/alertservice-edit-opsgenie';
import { AlertServiceAddOpsgenieComponent } from 'app/pages/system/alertservice/alertservice-add-opsgenie';

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
    BootEnvironmentRenameComponent,
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
    AlertServiceAddOpsgenieComponent,
    AlertServiceEditOpsgenieComponent,
    AlertServiceAddPagerdutyComponent,
    AlertServiceEditPagerdutyComponent,
    AlertServiceAddSlackComponent,
    AlertServiceEditSlackComponent,
    AlertServiceAddVictoropsComponent,
    AlertServiceEditVictoropsComponent,
    AlertServiceListComponent,
    CloudCredentialsGCSComponent,
    CloudCredentialsAmazonComponent,
    CloudCredentialsB2Component,
    CloudCredentialsListComponent,
    CloudCredentialsDeleteComponent,
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
