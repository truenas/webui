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
import { QrCodeModule } from 'ng-qrcode';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { OauthButtonModule } from 'app/modules/oauth-button/oauth-button.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { AdvancedSettingsComponent } from 'app/pages/system/advanced/advanced-settings.component';
import {
  AllowedAddressesCardComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { CronCardComponent } from 'app/pages/system/advanced/cron/cron-card/cron-card.component';
import { CronDeleteDialogComponent } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from 'app/pages/system/advanced/cron/cron-list/cron-list.component';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { InitShutdownCardComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-card/init-shutdown-card.component';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { InitshutdownListComponent } from 'app/pages/system/advanced/init-shutdown/initshutdown-list/initshutdown-list.component';
import {
  IsolatedGpusCardComponent,
} from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-card/isolated-gpus-card.component';
import { IsolatedGpusFormComponent } from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { KernelCardComponent } from 'app/pages/system/advanced/kernel/kernel-card/kernel-card.component';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import {
  ReplicationSettingsCardComponent,
} from 'app/pages/system/advanced/replication/replication-settings-card/replication-settings-card.component';
import { ReplicationSettingsFormComponent } from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';
import { SaveDebugButtonComponent } from 'app/pages/system/advanced/save-debug-button/save-debug-button.component';
import {
  SelfEncryptingDriveCardComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.component';
import { SelfEncryptingDriveFormComponent } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { SessionsCardComponent } from 'app/pages/system/advanced/sessions/sessions-card/sessions-card.component';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { StorageCardComponent } from 'app/pages/system/advanced/storage/storage-card/storage-card.component';
import { StorageSettingsFormComponent } from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { TunableListComponent } from 'app/pages/system/advanced/sysctl/tunable-list/tunable-list.component';
import { SyslogCardComponent } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.component';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { SystemSecurityCardComponent } from 'app/pages/system/advanced/system-security/system-security-card/system-security-card.component';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';
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
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { BootPoolAttachDialogComponent } from 'app/pages/system/bootenv/boot-pool-attach/boot-pool-attach-dialog.component';
import { BootPoolDeleteDialogComponent } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
import { BootPoolReplaceDialogComponent } from 'app/pages/system/bootenv/boot-pool-replace/boot-pool-replace-dialog.component';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { BootEnvironmentListComponent } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.component';
import { BootenvStatsDialogComponent } from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { BootStatusListComponent } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';
import { FailoverSettingsComponent } from 'app/pages/system/failover-settings/failover-settings.component';
import { EmailCardComponent } from 'app/pages/system/general-settings/email/email-card/email-card.component';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';
import { GeneralSettingsComponent } from 'app/pages/system/general-settings/general-settings.component';
import { GuiCardComponent } from 'app/pages/system/general-settings/gui/gui-card/gui-card.component';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { LocalizationCardComponent } from 'app/pages/system/general-settings/localization/localization-card/localization-card.component';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import {
  ManageConfigurationMenuComponent,
} from 'app/pages/system/general-settings/manage-configuration-menu/manage-configuration-menu.component';
import { NtpServerCardComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-card/ntp-server-card.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import {
  SaveConfigDialogComponent,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import { EulaComponent } from 'app/pages/system/general-settings/support/eula/eula.component';
import { LicenseComponent } from 'app/pages/system/general-settings/support/license/license.component';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import { SupportCardComponent } from 'app/pages/system/general-settings/support/support-card/support-card.component';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import {
  UploadConfigDialogComponent,
} from 'app/pages/system/general-settings/upload-config-dialog/upload-config-dialog.component';
import { ManualUpdateFormComponent } from 'app/pages/system/update/manual-update-form/manual-update-form.component';
import { UpdateComponent } from 'app/pages/system/update/update.component';
import { EnclosureModule } from 'app/pages/system/view-enclosure/enclosure.module';
import { QrDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-dialog/qr-dialog.component';
import { ConsoleCardComponent } from './advanced/console/console-card/console-card.component';
import { SysctlCardComponent } from './advanced/sysctl/sysctl-card/sysctl-card.component';
import { AlertSettingsComponent } from './alert-settings/alert-settings.component';
import { BootenvNodeItemComponent } from './bootenv/bootenv-status/bootenv-node-item/bootenv-node-item.component';
import { FileTicketModule } from './file-ticket/file-ticket.module';
import { SetProductionStatusDialogComponent } from './general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
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
    TreeModule,
    SchedulerModule,
    JobsModule,
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
    QrCodeModule,
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
    TestIdModule,
    IxTable2Module,
    OauthButtonModule,
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
    CronDeleteDialogComponent,
    EmailFormComponent,
    EmailCardComponent,
    SystemSecurityFormComponent,
    SystemSecurityCardComponent,
    EulaComponent,
    FailoverSettingsComponent,
    GeneralSettingsComponent,
    GuiFormComponent,
    GuiCardComponent,
    GlobalTwoFactorAuthCardComponent,
    LocalizationCardComponent,
    InitShutdownFormComponent,
    InitshutdownListComponent,
    IsolatedGpusFormComponent,
    KernelFormComponent,
    LicenseComponent,
    LocalizationFormComponent,
    ManualUpdateFormComponent,
    NtpServerFormComponent,
    NtpServerCardComponent,
    ProactiveComponent,
    QrDialogComponent,
    ReplicationSettingsFormComponent,
    TokenSettingsComponent,
    AllowedAddressesFormComponent,
    SysInfoComponent,
    SyslogCardComponent,
    SyslogFormComponent,
    StorageSettingsFormComponent,
    StorageCardComponent,
    SelfEncryptingDriveFormComponent,
    TunableFormComponent,
    TunableListComponent,
    UpdateComponent,
    BootenvStatsDialogComponent,
    CronFormComponent,
    GlobalTwoFactorAuthFormComponent,
    CronCardComponent,
    SaveConfigDialogComponent,
    UploadConfigDialogComponent,
    ManageConfigurationMenuComponent,
    SaveDebugButtonComponent,
    AwsSnsServiceComponent,
    InfluxDbServiceComponent,
    MattermostServiceComponent,
    OpsGenieServiceComponent,
    ReplicationSettingsCardComponent,
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
    SetProductionStatusDialogComponent,
    ConsoleCardComponent,
    SessionsCardComponent,
    AllowedAddressesCardComponent,
    SelfEncryptingDriveCardComponent,
    IsolatedGpusCardComponent,
    KernelCardComponent,
    SupportCardComponent,
    AlertSettingsComponent,
    InitShutdownCardComponent,
    SysctlCardComponent,
  ],
  providers: [
    TranslateService,
    DatePipe,
  ],
})
export class SystemModule {}
