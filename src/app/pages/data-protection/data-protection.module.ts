import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CloudCredentialsSelectModule } from 'app/modules/custom-selects/cloud-credentials-select/cloud-credentials-select.module';
import { SshCredentialsSelectModule } from 'app/modules/custom-selects/ssh-credentials-select/ssh-credentials-select.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
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
    CommonModule,
    CommonDirectivesModule,
    FlexLayoutModule,
    RouterModule.forChild(dataProtectionRoutes),
    EntityModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatCardModule,
    TranslateModule,
    IxTableModule,
    IxFormsModule,
    CloudCredentialsSelectModule,
    SshCredentialsSelectModule,
    PageHeaderModule,
    SchedulerModule,
    MatButtonModule,
    MatDialogModule,
    IxIconModule,
    TestIdModule,
    MatStepperModule,
    LayoutModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDividerModule,
    CloudSyncProviderDescriptionComponent,
    SearchInput1Component,
    CoreComponents,
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
  ],
})
export class DataProtectionModule {}
