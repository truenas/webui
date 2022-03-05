import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { EntityModule } from '../../modules/entity/entity.module';
import { IxFormsModule } from '../../modules/ix-forms/ix-forms.module';
import { CloudsyncFormComponent } from './cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncListComponent } from './cloudsync/cloudsync-list/cloudsync-list.component';
import { DataProtectionDashboardComponent } from './components/data-protection-dashboard/data-protection-dashboard.component';
import { dataProtectionRoutes } from './data-protection.routing';
import { ReplicationFormComponent } from './replication/replication-form/replication-form.component';
import { ReplicationListComponent } from './replication/replication-list/replication-list.component';
import { ReplicationWizardComponent } from './replication/replication-wizard/replication-wizard.component';
import { RsyncFormComponent } from './rsync/rsync-form/rsync-form.component';
import { RsyncListComponent } from './rsync/rsync-list/rsync-list.component';
import { ResilverConfigComponent } from './scrub/resilver-config/resilver-config.component';
import { ScrubFormComponent } from './scrub/scrub-form/scrub-form.component';
import { ScrubListComponent } from './scrub/scrub-list/scrub-list.component';
import { SmartFormComponent } from './smart/smart-form/smart-form.component';
import { SmartListComponent } from './smart/smart-list/smart-list.component';
import { SnapshotFormComponent } from './snapshot/snapshot-form/snapshot-form.component';
import { SnapshotListComponent } from './snapshot/snapshot-list/snapshot-list.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    RouterModule.forChild(dataProtectionRoutes),
    EntityModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IxFormsModule,
  ],
  declarations: [
    SnapshotListComponent,
    SnapshotFormComponent,
    RsyncListComponent,
    RsyncFormComponent,
    SmartListComponent,
    SmartFormComponent,
    ReplicationListComponent,
    ReplicationFormComponent,
    ReplicationWizardComponent,
    ScrubListComponent,
    ScrubFormComponent,
    CloudsyncListComponent,
    CloudsyncFormComponent,
    DataProtectionDashboardComponent,
    ResilverConfigComponent,
  ],
})
export class DataProtectionModule {}
