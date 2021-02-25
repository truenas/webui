import { SyslogFormComponent } from './advanced/syslog-form/syslog-form.component';
import { KernelFormComponent } from './advanced/kernel-form/kernel-form.component';
import { ConsoleFormComponent } from './advanced/console-form/console-form.component';
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

import { AdvancedSettingsComponent } from './advanced/';
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
import { SupportComponent } from './general-settings/support/support.component';
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { TranslateModule } from '@ngx-translate/core';
import { EmailComponent } from './email';
import { AlertServiceComponent } from './alertservice/alert-service/alert-service.component';
import { AlertConfigComponent } from './alert/alert.component';
import { FailoverComponent } from './failover/failover.component';
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
    AdvancedSettingsComponent,
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
    SupportComponent,
    EmailComponent,
    AlertServiceComponent,
    AlertConfigComponent,
    FailoverComponent,
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
    LicenseComponent,
    ConsoleFormComponent,
    KernelFormComponent,
    SyslogFormComponent
  ],
  entryComponents: [QRDialog],
  providers: []
})
export class SystemModule {}
