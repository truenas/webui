import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
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
import { SaveDebugButtonComponent } from 'app/pages/system/advanced/save-debug-button/save-debug-button.component';
import { SedFormComponent } from 'app/pages/system/advanced/sed-form/sed-form.component';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog-form/syslog-form.component';
import { SystemDatasetPoolComponent } from 'app/pages/system/advanced/system-dataset-pool/system-dataset-pool.component';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { AwsSnsServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/aws-sns-service/aws-sns-service.component';
import {
  EmailServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/email-service/email-service.component';
import { InfluxDbServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/influx-db-service/influx-db-service.component';
import { MattermostServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/mattermost-service/mattermost-service.component';
import { OpsGenieServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/ops-genie-service/ops-genie-service.component';
import { PagerDutyServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/pager-duty-service/pager-duty-service.component';
import { SlackServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/slack-service/slack-service.component';
import { SnmpTrapServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/snmp-trap-service/snmp-trap-service.component';
import { TelegramServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/telegram-service/telegram-service.component';
import { VictorOpsServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-services/victor-ops-service/victor-ops-service.component';
import { BootPoolAttachDialogComponent } from 'app/pages/system/bootenv/boot-pool-attach/boot-pool-attach-dialog.component';
import { BootPoolDeleteDialogComponent } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
import { BootPoolReplaceDialogComponent } from 'app/pages/system/bootenv/boot-pool-replace/boot-pool-replace-dialog.component';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { BootenvStatsDialogComponent } from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { BootStatusListComponent } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';
import { EmailComponent } from 'app/pages/system/email/email.component';
import { FailoverSettingsComponent } from 'app/pages/system/failover-settings/failover-settings.component';
import { GeneralSettingsComponent } from 'app/pages/system/general-settings/general-settings.component';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui-form/gui-form.component';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization-form/localization-form.component';
import {
  ManageConfigurationMenuComponent,
} from 'app/pages/system/general-settings/manage-configuration-menu/manage-configuration-menu.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { NtpServerListComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-list/ntp-server-list.component';
import {
  SaveConfigDialogComponent,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import { EulaComponent } from 'app/pages/system/general-settings/support/eula/eula.component';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import { SupportComponent } from 'app/pages/system/general-settings/support/support.component';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import {
  UploadConfigDialogComponent,
} from 'app/pages/system/general-settings/upload-config-dialog/upload-config-dialog.component';
import { TunableFormComponent } from 'app/pages/system/tunable/tunable-form/tunable-form.component';
import { TunableListComponent } from 'app/pages/system/tunable/tunable-list/tunable-list.component';
import { QrDialogComponent } from 'app/pages/system/two-factor/qr-dialog/qr-dialog.component';
import { TwoFactorComponent } from 'app/pages/system/two-factor/two-factor.component';
import { ManualUpdateFormComponent } from 'app/pages/system/update/manual-update-form/manual-update-form.component';
import { UpdateComponent } from 'app/pages/system/update/update.component';
import { EnclosureModule } from 'app/pages/system/view-enclosure/enclosure.module';
import { ReplicationFormComponent } from './advanced/replication-form/replication-form.component';
import { BootenvNodeItemComponent } from './bootenv/bootenv-status/bootenv-node-item/bootenv-node-item.component';
import { FileTicketModule } from './file-ticket/file-ticket.module';
import { routing } from './system.routing';

@NgModule({
  imports: [
    AppLoaderModule,
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
    IxTreeModule,
    SchedulerModule,
    JobsModule,
    MarkdownModule.forRoot(),
    MatCardModule,
    IxIconModule,
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
    MatDialogModule,
    AppCommonModule,
    LayoutModule,
    FileTicketModule,
    MatExpansionModule,
    MatSlideToggleModule,
    AppLoaderModule,
  ],
  declarations: [
    AdvancedSettingsComponent,
    AlertConfigFormComponent,
    AlertServiceComponent,
    AlertServiceListComponent,
    BootEnvironmentFormComponent,
    BootEnvironmentListComponent,
    BootPoolAttachDialogComponent,
    BootPoolReplaceDialogComponent,
    BootStatusListComponent,
    ConsoleFormComponent,
    CronFormComponent,
    CronListComponent,
    EmailComponent,
    EulaComponent,
    FailoverSettingsComponent,
    GeneralSettingsComponent,
    GuiFormComponent,
    InitShutdownFormComponent,
    InitshutdownListComponent,
    IsolatedGpuPcisFormComponent,
    KernelFormComponent,
    LicenseComponent,
    LocalizationFormComponent,
    ManualUpdateFormComponent,
    NtpServerFormComponent,
    NtpServerListComponent,
    ProactiveComponent,
    QrDialogComponent,
    ReplicationFormComponent,
    SupportComponent,
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
    SaveConfigDialogComponent,
    UploadConfigDialogComponent,
    ManageConfigurationMenuComponent,
    SaveDebugButtonComponent,
    AwsSnsServiceComponent,
    InfluxDbServiceComponent,
    MattermostServiceComponent,
    OpsGenieServiceComponent,
    PagerDutyServiceComponent,
    SlackServiceComponent,
    SnmpTrapServiceComponent,
    TelegramServiceComponent,
    VictorOpsServiceComponent,
    AwsSnsServiceComponent,
    EmailServiceComponent,
    InfluxDbServiceComponent,
    MattermostServiceComponent,
    OpsGenieServiceComponent,
    PagerDutyServiceComponent,
    SlackServiceComponent,
    SnmpTrapServiceComponent,
    TelegramServiceComponent,
    VictorOpsServiceComponent,
    BootenvNodeItemComponent,
    BootPoolDeleteDialogComponent,
  ],
  providers: [
    TranslateService,
    DatePipe,
  ],
})
export class SystemModule {}
