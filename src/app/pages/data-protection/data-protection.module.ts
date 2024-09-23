import {
  AsyncPipe, DatePipe, NgTemplateOutlet,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IxDetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EntityModule } from 'app/modules/entity/entity.module';
import { CloudCredentialsSelectModule } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.module';
import { SshCredentialsSelectModule } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
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
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudSyncProviderDescriptionComponent } from 'app/pages/data-protection/cloudsync/cloudsync-provider-description/cloudsync-provider-description.component';
import {
  CloudSyncRestoreDialogComponent,
} from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncTaskCardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-task-card/cloudsync-task-card.component';
import { CreateStorjBucketDialogComponent } from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';
import { CustomTransfersDialogComponent } from 'app/pages/data-protection/cloudsync/custom-transfers-dialog/custom-transfers-dialog.component';
import {
  TransferModeExplanationComponent,
} from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { DataProtectionDashboardComponent } from 'app/pages/data-protection/data-protection-dashboard.component';
import {
  TransportSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/transport-section/transport-section.component';
import { ReplicationListComponent } from 'app/pages/data-protection/replication/replication-list/replication-list.component';
import {
  ReplicationRestoreDialogComponent,
} from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ReplicationTaskCardComponent } from 'app/pages/data-protection/replication/replication-task-card/replication-task-card.component';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';
import { RsyncTaskCardComponent } from 'app/pages/data-protection/rsync-task/rsync-task-card/rsync-task-card.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { ScrubTaskCardComponent } from 'app/pages/data-protection/scrub-task/scrub-task-card/scrub-task-card.component';
import {
  ScrubTaskFormComponent,
} from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { SmartTaskCardComponent } from 'app/pages/data-protection/smart-task/smart-task-card/smart-task-card.component';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { SnapshotTaskCardComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.component';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { SnapshotTaskListComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-list/snapshot-task-list.component';
import { VmwareSnapshotFormComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-form/vmware-snapshot-form.component';
import { VmwareSnapshotListComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.component';
import { VmwareStatusCellComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-status-cell/vmware-status-cell.component';
import { CloudBackupCardComponent } from './cloud-backup/cloud-backup-card/cloud-backup-card.component';
import { CloudBackupDetailsComponent } from './cloud-backup/cloud-backup-details/cloud-backup-details.component';
import {
  CloudBackupExcludedPathsComponent,
} from './cloud-backup/cloud-backup-details/cloud-backup-excluded-paths/cloud-backup-excluded-paths.component';
import {
  CloudBackupScheduleComponent,
} from './cloud-backup/cloud-backup-details/cloud-backup-schedule/cloud-backup-schedule.component';
import {
  CloudBackupSnapshotsComponent,
} from './cloud-backup/cloud-backup-details/cloud-backup-snapshots/cloud-backup-snapshots.component';
import {
  CloudBackupStatsComponent,
} from './cloud-backup/cloud-backup-details/cloud-backup-stats/cloud-backup-stats.component';
import { CloudBackupListComponent } from './cloud-backup/cloud-backup-list/cloud-backup-list.component';
import { CloudSyncFormComponent } from './cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudSyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { CloudSyncWizardComponent } from './cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { CloudSyncProviderComponent } from './cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.component';
import { CloudSyncWhatAndWhenComponent } from './cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { dataProtectionRoutes } from './data-protection.routing';
import { ReplicationFormComponent } from './replication/replication-form/replication-form.component';
import { GeneralSectionComponent } from './replication/replication-form/sections/general-section/general-section.component';
import { ScheduleSectionComponent } from './replication/replication-form/sections/schedule-section/schedule-section.component';
import { SourceSectionComponent } from './replication/replication-form/sections/source-section/source-section.component';
import { TargetSectionComponent } from './replication/replication-form/sections/target-section/target-section.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { RsyncTaskListComponent } from './rsync-task/rsync-task-list/rsync-task-list.component';
import { ResilverConfigComponent } from './scrub-task/resilver-config/resilver-config.component';
import { ScrubListComponent } from './scrub-task/scrub-list/scrub-list.component';
import { SmartTaskListComponent } from './smart-task/smart-task-list/smart-task-list.component';

@NgModule({
  imports: [
    RouterModule.forChild(dataProtectionRoutes),
    EntityModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatCardModule,
    TranslateModule,
    CloudCredentialsSelectModule,
    SshCredentialsSelectModule,
    PageHeaderModule,
    SchedulerModule,
    MatButtonModule,
    MatDialogModule,
    IxIconComponent,
    TestIdModule,
    MatStepperModule,
    JobsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDividerModule,
    CloudSyncProviderDescriptionComponent,
    SearchInput1Component,
    MatProgressSpinnerModule,
    IxExplorerComponent,
    IxFieldsetComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    IxRadioGroupComponent,
    IxChipsComponent,
    IxModalHeader2Component,
    IxModalHeaderComponent,
    IxComboboxComponent,
    IxSlideToggleComponent,
    IxTextareaComponent,
    AsyncPipe,
    NgTemplateOutlet,
    DatePipe,
    IxDetailsHeightDirective,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    IxTableDetailsRowComponent,
    IxTableDetailsRowDirective,
    IxTableColumnsSelectorComponent,
    IxTableCellDirective,
  ],
  declarations: [
    SnapshotTaskListComponent,
    SnapshotTaskFormComponent,
    VmwareSnapshotFormComponent,
    VmwareSnapshotListComponent,
    VmwareStatusCellComponent,
    RsyncTaskListComponent,
    RsyncTaskFormComponent,
    SmartTaskListComponent,
    SmartTaskFormComponent,
    ReplicationListComponent,
    ReplicationFormComponent,
    ReplicationWizardComponent,
    ReplicationWhatAndWhereComponent,
    ReplicationWhenComponent,
    CreateStorjBucketDialogComponent,
    ScrubTaskFormComponent,
    CloudSyncListComponent,
    CloudSyncFormComponent,
    DataProtectionDashboardComponent,
    ResilverConfigComponent,
    CloudSyncRestoreDialogComponent,
    TransferModeExplanationComponent,
    ReplicationRestoreDialogComponent,
    CustomTransfersDialogComponent,
    GeneralSectionComponent,
    TransportSectionComponent,
    ScheduleSectionComponent,
    SourceSectionComponent,
    TargetSectionComponent,
    RsyncTaskCardComponent,
    CloudSyncTaskCardComponent,
    SmartTaskCardComponent,
    ReplicationTaskCardComponent,
    ScrubTaskCardComponent,
    SnapshotTaskCardComponent,
    CloudSyncWizardComponent,
    CloudSyncProviderComponent,
    CloudSyncWhatAndWhenComponent,
    ScrubListComponent,
    RsyncTaskListComponent,
    CloudBackupListComponent,
    CloudBackupCardComponent,
    CloudBackupDetailsComponent,
    CloudBackupExcludedPathsComponent,
    CloudBackupScheduleComponent,
    CloudBackupStatsComponent,
    CloudBackupSnapshotsComponent,
    CloudBackupFormComponent,
    CloudBackupRestoreFromSnapshotFormComponent,
  ],
})
export class DataProtectionModule {}
