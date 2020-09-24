import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxUploaderModule } from 'ngx-uploader';

import { QRCodeModule } from 'angular2-qrcode';
import { EntityModule } from '../common/entity/entity.module';

import { MaterialModule } from '../../appMaterial.module';
import { MarkdownModule } from 'ngx-markdown';
import { routing } from './system.routing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonDirectivesModule } from '../../directives/common/common-directives.module';

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
import { NTPServerFormComponent } from './general-settings/ntpservers/ntpserver-form';
import { CertificateAuthorityListComponent } from './ca/ca-list/';
import { CertificateAuthorityAddComponent } from './ca/ca-add/';
import { CertificateAuthorityEditComponent } from './ca/ca-edit/';
import { CertificateAuthoritySignComponent } from './ca/ca-sign/';
import { CertificateEditComponent } from './certificates/certificate-edit/';
import { CertificateListComponent } from './certificates/certificate-list';
import { CertificateAddComponent } from './certificates/certificate-add';
import { SupportComponent } from './general-settings/support/support.component';
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
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { ProactiveComponent } from './general-settings/support/proactive/proactive.component';
import { SupportFormLicensedComponent } from './general-settings/support/support-licensed/support-form-licensed.component';
import { SupportFormUnlicensedComponent } from './general-settings/support/support-unlicensed/support-form-unlicensed.component';
import { SysInfoComponent } from './general-settings/support/sys-info/sys-info.component'
import { KmipComponent} from './kmip/kmip.component';
import { TwoFactorComponent } from './two-factor/two-factor.component';
import { QRDialog } from './two-factor/two-factor.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { LocalizationFormComponent } from './general-settings/localization-form/localization-form.component';
import { GuiFormComponent } from './general-settings/gui-form/gui-form.component';
import { LicenseComponent } from './general-settings/support/license/license.component';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing,
    MaterialModule, MarkdownModule.forRoot(), TranslateModule, FlexLayoutModule,
    EnclosureModule, CommonDirectivesModule, QRCodeModule
  ],
  declarations: [
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
    NTPServerFormComponent,
    AlertServiceListComponent,
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
    ProactiveComponent,
    SupportFormLicensedComponent,
    SupportFormUnlicensedComponent,
    SysInfoComponent,
    KmipComponent,
    TwoFactorComponent,
    QRDialog,
    GeneralSettingsComponent,
    LocalizationFormComponent,
    GuiFormComponent,
    LicenseComponent
  ],
  entryComponents: [QRDialog],
  providers: []
})
export class SystemModule {}
