import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QRCodeModule } from 'angular2-qrcode';
import { NgxFilesizeModule } from 'ngx-filesize';
import { MarkdownModule } from 'ngx-markdown';
import { NgxUploaderModule } from 'ngx-uploader';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { AdvancedSettingsComponent } from 'app/pages/system/advanced/advanced-settings.component';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console-form/console-form.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from 'app/pages/system/advanced/cron/cron-list/cron-list.component';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/initshutdown/init-shutdown-form/init-shutdown-form.component';
import { InitshutdownListComponent } from 'app/pages/system/advanced/initshutdown/initshutdown-list/initshutdown-list.component';
import { IsolatedGpuPcisFormComponent } from 'app/pages/system/advanced/isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel-form/kernel-form.component';
import { SedFormComponent } from 'app/pages/system/advanced/sed-form/sed-form.component';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog-form/syslog-form.component';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { AlertConfigComponent } from 'app/pages/system/alert/alert.component';
import { BootPoolAttachFormComponent } from 'app/pages/system/bootenv/boot-pool-attach/boot-pool-attach-form.component';
import { BootPoolReplaceFormComponent } from 'app/pages/system/bootenv/boot-pool-replace/boot-pool-replace-form.component';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { BootenvStatsDialogComponent } from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { BootStatusListComponent } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';
import { EmailComponent } from 'app/pages/system/email/email.component';
import { FailoverSettingsComponent } from 'app/pages/system/failover-settings/failover-settings.component';
import { GeneralSettingsComponent } from 'app/pages/system/general-settings/general-settings.component';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui-form/gui-form.component';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization-form/localization-form.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { NtpServerListComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-list/ntp-server-list.component';
import { EulaComponent } from 'app/pages/system/general-settings/support/eula/eula.component';
import { JiraOauthComponent } from 'app/pages/system/general-settings/support/file-ticket-form/components/jira-oauth/jira-oauth.component';
import { FileTicketFormComponent } from 'app/pages/system/general-settings/support/file-ticket-form/file-ticket-form.component';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import { SupportFormLicensedComponent } from 'app/pages/system/general-settings/support/support-licensed/support-form-licensed.component';
import { SupportComponent } from 'app/pages/system/general-settings/support/support.component';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import { KmipComponent } from 'app/pages/system/kmip/kmip.component';
import { TunableFormComponent } from 'app/pages/system/tunable/tunable-form/tunable-form.component';
import { TunableListComponent } from 'app/pages/system/tunable/tunable-list/tunable-list.component';
import { QrDialogComponent } from 'app/pages/system/two-factor/qr-dialog/qr-dialog.component';
import { TwoFactorComponent } from 'app/pages/system/two-factor/two-factor.component';
import { ManualUpdateFormComponent } from 'app/pages/system/update/manual-update-form/manual-update-form.component';
import { UpdateComponent } from 'app/pages/system/update/update.component';
import { EnclosureModule } from 'app/pages/system/view-enclosure/enclosure.module';
import { ReplicationFormComponent } from './advanced/replication-form/replication-form.component';
import { routing } from './system.routing';

@NgModule({
  imports: [
    CastModule,
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    EnclosureModule,
    EntityModule,
    FlexLayoutModule,
    FormsModule,
    IxFormsModule,
    IxTableModule,
    SchedulerModule,
    JobsModule,
    MarkdownModule.forRoot(),
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDividerModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    NgxUploaderModule,
    QRCodeModule,
    ReactiveFormsModule,
    routing,
    TooltipModule,
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
    ManualUpdateFormComponent,
    BootStatusListComponent,
    ConsoleFormComponent,
    CronFormComponent,
    CronListComponent,
    EmailComponent,
    EulaComponent,
    FailoverSettingsComponent,
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
