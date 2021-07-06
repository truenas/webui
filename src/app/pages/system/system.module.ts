import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angular2-qrcode';
import { MarkdownModule } from 'ngx-markdown';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { IXFormActions } from 'app/pages/system/general-settings/localization-form2/components/ix-form-actions/ix-form-actions.component';
import { IXFormErrorsComponent } from 'app/pages/system/general-settings/localization-form2/components/ix-form-errors/ix-form-errors.component';
import { IXFormFieldSet } from 'app/pages/system/general-settings/localization-form2/components/ix-form-field-set/ix-form-field-set.component';
import { IXFormComponent } from 'app/pages/system/general-settings/localization-form2/components/ix-form/ix-form.component';
import { IXInputComponent } from 'app/pages/system/general-settings/localization-form2/components/ix-input/ix-input.component';
import { IXSelectComponent } from 'app/pages/system/general-settings/localization-form2/components/ix-select/ix-select.component';
import { EntityModule } from '../common/entity/entity.module';
import { AdvancedSettingsComponent } from './advanced';
import { ConsoleFormComponent } from './advanced/console-form/console-form.component';
import { CronFormComponent } from './advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from './advanced/cron/cron-list/cron-list.component';
import { InitshutdownFormComponent } from './advanced/initshutdown/initshutdown-form/initshutdown-form.component';
import { InitshutdownListComponent } from './advanced/initshutdown/initshutdown-list/initshutdown-list.component';
import { IsolatedGpuPcisFormComponent } from './advanced/isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { KernelFormComponent } from './advanced/kernel-form/kernel-form.component';
import { SyslogFormComponent } from './advanced/syslog-form/syslog-form.component';
import { AlertConfigComponent } from './alert/alert.component';
import { AlertServiceComponent } from './alertservice/alert-service/alert-service.component';
import { AlertServiceListComponent } from './alertservice/alertservice-list/alertservice-list.component';
import { BootEnvAttachFormComponent } from './bootenv/bootenv-attach';
import { BootEnvironmentCloneComponent } from './bootenv/bootenv-clone';
import { BootEnvironmentCreateComponent } from './bootenv/bootenv-create';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list';
import { BootEnvironmentRenameComponent } from './bootenv/bootenv-rename';
import { BootEnvReplaceFormComponent } from './bootenv/bootenv-replace';
import { BootStatusListComponent } from './bootenv/bootenv-status';
import { EmailComponent } from './email';
import { FailoverComponent } from './failover/failover.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { GuiFormComponent } from './general-settings/gui-form/gui-form.component';
import { LocalizationFormComponent } from './general-settings/localization-form/localization-form.component';
import { LocalizationForm2Component } from './general-settings/localization-form2/localization-form2.component';
import { NTPServerFormComponent } from './general-settings/ntpservers/ntpserver-form';
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { LicenseComponent } from './general-settings/support/license/license.component';
import { ProactiveComponent } from './general-settings/support/proactive/proactive.component';
import { SupportFormLicensedComponent } from './general-settings/support/support-licensed/support-form-licensed.component';
import { SupportFormUnlicensedComponent } from './general-settings/support/support-unlicensed/support-form-unlicensed.component';
import { SupportComponent } from './general-settings/support/support.component';
import { SysInfoComponent } from './general-settings/support/sys-info/sys-info.component';
import { KmipComponent } from './kmip/kmip.component';
import { routing } from './system.routing';
import { TunableFormComponent } from './tunable/tunable-form';
import { TunableListComponent } from './tunable/tunable-list';
import { TwoFactorComponent, QRDialog } from './two-factor/two-factor.component';
import { UpdateComponent } from './update';
import { ManualUpdateComponent } from './update/manualupdate';
import { EnclosureModule } from './viewenclosure/enclosure.module';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing,
    MaterialModule, MarkdownModule.forRoot(), TranslateModule, FlexLayoutModule,
    EnclosureModule, CommonDirectivesModule, QRCodeModule,
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
    IsolatedGpuPcisFormComponent,
    KernelFormComponent,
    SyslogFormComponent,
    InitshutdownFormComponent,
    InitshutdownListComponent,
    CronFormComponent,
    CronListComponent,
    SystemDatasetPoolComponent,
    LocalizationForm2Component,
    IXInputComponent,
    IXSelectComponent,
    IXFormErrorsComponent,
    IXFormFieldSet,
    IXFormActions,
    IXFormComponent,
  ],
  entryComponents: [QRDialog],
  providers: [],
})
export class SystemModule {}
