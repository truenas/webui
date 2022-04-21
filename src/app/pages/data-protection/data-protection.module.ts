import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { RsyncTaskListComponent } from 'app/pages/data-protection/rsync-task/rsync-task-list/rsync-task-list.component';
import {
  ScrubTaskFormComponent,
} from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { EntityModule } from '../../modules/entity/entity.module';
import { IxFormsModule } from '../../modules/ix-forms/ix-forms.module';
import { CloudsyncFormComponent } from './cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { DataProtectionDashboardComponent } from './components/data-protection-dashboard/data-protection-dashboard.component';
import { dataProtectionRoutes } from './data-protection.routing';
import { ReplicationFormComponent } from './replication/replication-form/replication-form.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { ResilverConfigComponent } from './scrub-task/resilver-config/resilver-config.component';
import { ScrubListComponent } from './scrub-task/scrub-list/scrub-list.component';
import { SmartTaskListComponent } from './smart-task/smart-task-list/smart-task-list.component';
import { SnapshotListComponent } from './snapshot/snapshot-list/snapshot-list.component';
import { SnapshotTaskComponent } from './snapshot/snapshot-task/snapshot-task.component';

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    RouterModule.forChild(dataProtectionRoutes),
    EntityModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatCardModule,
    TranslateModule,
    IxFormsModule,
    SchedulerModule,
    MatButtonModule,
  ],
  declarations: [
    SnapshotListComponent,
    SnapshotTaskComponent,
    RsyncTaskListComponent,
    RsyncTaskFormComponent,
    SmartTaskListComponent,
    SmartTaskFormComponent,
    ReplicationListComponent,
    ReplicationFormComponent,
    ReplicationWizardComponent,
    ScrubListComponent,
    ScrubTaskFormComponent,
    CloudsyncListComponent,
    CloudsyncFormComponent,
    DataProtectionDashboardComponent,
    ResilverConfigComponent,
  ],
})
export class DataProtectionModule {}
