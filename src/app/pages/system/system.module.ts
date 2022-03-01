import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QRCodeModule } from 'angular2-qrcode';
import { NgxFilesizeModule } from 'ngx-filesize';
import { MarkdownModule } from 'ngx-markdown';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/initshutdown/init-shutdown-form/init-shutdown-form.component';
import { SedFormComponent } from 'app/pages/system/advanced/sed-form/sed-form.component';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import {
  BootenvStatsDialogComponent,
} from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization-form/localization-form.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { NtpServerListComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-list/ntp-server-list.component';
import { JiraOauthComponent } from 'app/pages/system/general-settings/support/file-ticket-form/components/jira-oauth/jira-oauth.component';
import { QrDialogComponent } from 'app/pages/system/two-factor/qr-dialog/qr-dialog.component';
import { ManualUpdateComponent } from 'app/pages/system/update/manual-update/manual-update.component';
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
    CastModule,
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EnclosureModule, EntityModule,
    FlexLayoutModule,
    FormsModule,
    IxFormsModule,
    IxTableModule,
    SchedulerModule,
    JobsModule,
    MarkdownModule.forRoot(),

    MaterialModule,
    NgxUploaderModule,
    QRCodeModule,
    ReactiveFormsModule,
    routing, TooltipModule,
    TranslateModule,
    NgxFilesizeModule,
  ],
  declarations: [
    AdvancedSettingsComponent,
    AlertConfigComponent,
    AlertServiceComponent,
    AlertServiceListComponent,
    BootEnvironmentFormComponent,
    BootEnvironmentListComponent,
    BootPoolAttachFormComponent,
    BootPoolReplaceFormComponent,
    BootStatusListComponent,
    ConsoleFormComponent,
    CronFormComponent,
    CronListComponent,
    EmailComponent,
    EulaComponent,
    FailoverComponent,
    FileTicketFormComponent,
    GeneralSettingsComponent,
    GuiFormComponent,
    InitShutdownFormComponent,
    InitshutdownListComponent,
    IsolatedGpuPcisFormComponent,
    JiraOauthComponent,
    KernelFormComponent,
    KmipComponent,
    LicenseComponent,
    LocalizationFormComponent,
    ManualUpdateComponent,
    NtpServerFormComponent,
    NtpServerListComponent,
    ProactiveComponent,
    QrDialogComponent,
    ReplicationFormComponent,
    SupportComponent,
    SupportFormLicensedComponent,
    SysInfoComponent,
    SyslogFormComponent,
    SystemDatasetPoolComponent,
    SedFormComponent,
    TunableFormComponent,
    TunableListComponent,
    TwoFactorComponent,
    UpdateComponent,
    BootenvStatsDialogComponent,
    CronFormComponent,
  ],
  providers: [
    TranslateService,
  ],
})
export class SystemModule {}
