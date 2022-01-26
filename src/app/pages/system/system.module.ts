import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QRCodeModule } from 'angular2-qrcode';
import { MarkdownModule } from 'ngx-markdown';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/app-material.module';
import { JobsManagerModule } from 'app/components/common/dialog/jobs-manager/jobs-manager.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/initshutdown/init-shutdown-form/init-shutdown-form.component';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization-form/localization-form.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { NtpServerListComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-list/ntp-server-list.component';
import { JiraOauthComponent } from 'app/pages/system/general-settings/support/file-ticket-form/components/jira-oauth/jira-oauth.component';
import { QrDialogComponent } from 'app/pages/system/two-factor/qr-dialog/qr-dialog.component';
import { ManualUpdateComponent } from 'app/pages/system/update/manual-update/manual-update.component';
import { CoreComponents } from '../../core/components/core-components.module';
import { EntityModule } from '../../modules/entity/entity.module';
import { AdvancedSettingsComponent } from './advanced/advanced-settings.component';
import { ConsoleFormComponent } from './advanced/console-form/console-form.component';
import { CronFormComponent } from './advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from './advanced/cron/cron-list/cron-list.component';
import { InitshutdownListComponent } from './advanced/initshutdown/initshutdown-list/initshutdown-list.component';
import { IsolatedGpuPcisFormComponent } from './advanced/isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { KernelFormComponent } from './advanced/kernel-form/kernel-form.component';
import { ReplicationFormComponent } from './advanced/replication-form/replication-form.component';
import { SyslogFormComponent } from './advanced/syslog-form/syslog-form.component';
import { AlertServiceComponent } from './alert-service/alert-service/alert-service.component';
import { AlertConfigComponent } from './alert/alert.component';
import { BootPoolAttachFormComponent } from './bootenv/boot-pool-attach/boot-pool-attach-form.component';
import { BootPoolReplaceFormComponent } from './bootenv/boot-pool-replace/boot-pool-replace-form.component';
import { BootEnvironmentFormComponent } from './bootenv/bootenv-form/bootenv-form.component';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/bootenv-list.component';
import { BootStatusListComponent } from './bootenv/bootenv-status/bootenv-status.component';
import { EmailComponent } from './email/email.component';
import { FailoverComponent } from './failover/failover.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { GuiFormComponent } from './general-settings/gui-form/gui-form.component';
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { FileTicketFormComponent } from './general-settings/support/file-ticket-form/file-ticket-form.component';
import { LicenseComponent } from './general-settings/support/license/license.component';
import { ProactiveComponent } from './general-settings/support/proactive/proactive.component';
import { SupportFormLicensedComponent } from './general-settings/support/support-licensed/support-form-licensed.component';
import { SupportComponent } from './general-settings/support/support.component';
import { SysInfoComponent } from './general-settings/support/sys-info/sys-info.component';
import { KmipComponent } from './kmip/kmip.component';
import { routing } from './system.routing';
import { TunableFormComponent } from './tunable/tunable-form/tunable-form.component';
import { TunableListComponent } from './tunable/tunable-list/tunable-list.component';
import { TwoFactorComponent } from './two-factor/two-factor.component';
import { UpdateComponent } from './update/update.component';
import { EnclosureModule } from './view-enclosure/enclosure.module';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule, IxFormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing,
    MaterialModule, MarkdownModule.forRoot(), TranslateModule, FlexLayoutModule,
    EnclosureModule, CommonDirectivesModule, QRCodeModule,
    TooltipModule, CoreComponents, CastModule, IxTableModule, JobsManagerModule,
  ],
  declarations: [
    AdvancedSettingsComponent,
    LocalizationFormComponent,
    BootEnvironmentListComponent,
    BootEnvironmentFormComponent,
    BootStatusListComponent,
    BootPoolAttachFormComponent,
    BootPoolReplaceFormComponent,
    TunableListComponent,
    TunableFormComponent,
    UpdateComponent,
    ManualUpdateComponent,
    NtpServerFormComponent,
    NtpServerListComponent,
    AlertServiceListComponent,
    SupportComponent,
    EmailComponent,
    AlertServiceComponent,
    AlertConfigComponent,
    FailoverComponent,
    EulaComponent,
    ProactiveComponent,
    SupportFormLicensedComponent,
    FileTicketFormComponent,
    SysInfoComponent,
    KmipComponent,
    TwoFactorComponent,
    QrDialogComponent,
    GeneralSettingsComponent,
    GuiFormComponent,
    LicenseComponent,
    ConsoleFormComponent,
    IsolatedGpuPcisFormComponent,
    KernelFormComponent,
    ReplicationFormComponent,
    SyslogFormComponent,
    InitShutdownFormComponent,
    InitshutdownListComponent,
    CronFormComponent,
    CronListComponent,
    SystemDatasetPoolComponent,
    JiraOauthComponent,
  ],
  providers: [
    TranslateService,
  ],
  entryComponents: [QrDialogComponent],
})
export class SystemModule {}
