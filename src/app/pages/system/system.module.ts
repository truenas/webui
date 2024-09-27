import {
  AsyncPipe, DatePipe, KeyValuePipe,
} from '@angular/common';
import { NgModule } from '@angular/core';
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
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { OauthButtonModule } from 'app/modules/buttons/oauth-button/oauth-button.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import {
  UnusedDiskSelectComponent,
} from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import {
  IxModalHeader2Component,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header2/ix-modal-header2.component';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import {
  WithLoadingStateDirective,
} from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { AccessCardComponent } from 'app/pages/system/advanced/access/access-card/access-card.component';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { AdvancedSettingsComponent } from 'app/pages/system/advanced/advanced-settings.component';
import {
  AllowedAddressesCardComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { AuditCardComponent } from 'app/pages/system/advanced/audit/audit-card/audit-card.component';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { CronCardComponent } from 'app/pages/system/advanced/cron/cron-card/cron-card.component';
import { CronDeleteDialogComponent } from 'app/pages/system/advanced/cron/cron-delete-dialog/cron-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronListComponent } from 'app/pages/system/advanced/cron/cron-list/cron-list.component';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { InitShutdownCardComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-card/init-shutdown-card.component';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { InitShutdownListComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-list/init-shutdown-list.component';
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
import { AlertSettings2Component } from 'app/pages/system/alert-settings2/alert-settings2.component';
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
import { ManualUpdateFormComponent } from 'app/pages/system/update/components/manual-update-form/manual-update-form.component';
import { TrainCardComponent } from 'app/pages/system/update/components/train-card/train-card.component';
import { TrainInfoCardComponent } from 'app/pages/system/update/components/train-info-card/train-info-card.component';
import { UpdateActionsCardComponent } from 'app/pages/system/update/components/update-actions-card/update-actions-card.component';
import { UpdateComponent } from 'app/pages/system/update/update.component';
import { ConsoleCardComponent } from './advanced/console/console-card/console-card.component';
import { SysctlCardComponent } from './advanced/sysctl/sysctl-card/sysctl-card.component';
import { AlertSettingsComponent } from './alert-settings/alert-settings.component';
import { BootenvNodeItemComponent } from './bootenv/bootenv-status/bootenv-node-item/bootenv-node-item.component';
import { SetProductionStatusDialogComponent } from './general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
import { routing } from './system.routing';

@NgModule({
  imports: [
    FormsModule,
    TreeModule,
    SchedulerModule,
    MatCardModule,
    IxIconComponent,
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
    ReactiveFormsModule,
    routing,
    TranslateModule,
    MatDialogModule,
    MatExpansionModule,
    MatSlideToggleModule,
    OauthButtonModule,
    UnusedDiskSelectComponent,
    SearchInput1Component,
    EmptyComponent,
    FileSizePipe,
    TooltipComponent,
    FormatDateTimePipe,
    MapValuePipe,
    BulkListItemComponent,
    YesNoPipe,
    CastPipe,
    IxInputComponent,
    IxFieldsetComponent,
    IxFileInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxModalHeaderComponent,
    IxTextareaComponent,
    FormActionsComponent,
    IxComboboxComponent,
    IxRadioGroupComponent,
    IxChipsComponent,
    IxModalHeader2Component,
    IxSlideToggleComponent,
    WithManageCertificatesLinkComponent,
    IxListComponent,
    IxListItemComponent,
    IxExplorerComponent,
    PageHeaderModule,
    AsyncPipe,
    KeyValuePipe,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    IxTableDetailsRowDirective,
    IxTableDetailsRowComponent,
    IxTablePagerComponent,
    IxTableColumnsSelectorComponent,
    FakeProgressBarComponent,
    TestDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    WithLoadingStateDirective,
    TestOverrideDirective,
    TestOverrideDirective,
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
    IsolatedGpusFormComponent,
    KernelFormComponent,
    LicenseComponent,
    LocalizationFormComponent,
    ManualUpdateFormComponent,
    NtpServerFormComponent,
    NtpServerCardComponent,
    ProactiveComponent,
    ReplicationSettingsFormComponent,
    AccessFormComponent,
    AllowedAddressesFormComponent,
    SysInfoComponent,
    SyslogCardComponent,
    AuditCardComponent,
    SyslogFormComponent,
    AuditFormComponent,
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
    AccessCardComponent,
    AllowedAddressesCardComponent,
    SelfEncryptingDriveCardComponent,
    IsolatedGpusCardComponent,
    KernelCardComponent,
    SupportCardComponent,
    AlertSettingsComponent,
    AlertSettings2Component,
    InitShutdownCardComponent,
    SysctlCardComponent,
    InitShutdownListComponent,
    TrainCardComponent,
    TrainInfoCardComponent,
    UpdateActionsCardComponent,
  ],
  providers: [
    TranslateService,
    DatePipe,
  ],
})
export class SystemModule {}
