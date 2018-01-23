import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../appMaterial.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CalendarModule } from 'angular-calendar';
import { TaskCalendarComponent } from './calendar/calendar.component';
import { TaskCalendarRoutes } from "./task-calendar.routing";
import { EntityModule } from '../common/entity/entity.module';

import { CronFormComponent } from './cron/cron-form/cron-form.component';
import { CronListComponent } from './cron/cron-list/cron-list.component';
import { InitshutdownListComponent } from './initshutdown/initshutdown-list/initshutdown-list.component';
import { InitshutdownFormComponent } from './initshutdown/initshutdown-form/initshutdown-form.component';
import { SnapshotListComponent } from './snapshot/snapshot-list/snapshot-list.component';
import { SnapshotFormComponent } from './snapshot/snapshot-form/snapshot-form.component';
import { RsyncListComponent } from './rsync/rsync-list/rsync-list.component';
import { RsyncFormComponent } from './rsync/rsync-form/rsync-form.component';
import { SmartListComponent } from './smart/smart-list/smart-list.component';
import { SmartFormComponent } from './smart/smart-form/smart-form.component';
import { ReplicationListComponent } from 'app/pages/task-calendar/replication/replication-list';
import { ReplicationFormComponent } from 'app/pages/task-calendar/replication/replication-form';
import { ReplicationService } from 'app/pages/task-calendar/replication/replication.service';
import { ScrubListComponent } from './scrub/scrub-list/scrub-list.component';
import { ScrubFormComponent } from './scrub/scrub-form/scrub-form.component';


@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    CalendarModule.forRoot(),
    RouterModule.forChild(TaskCalendarRoutes),
    EntityModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    TaskCalendarComponent,
    CronFormComponent,
    CronListComponent,
    InitshutdownListComponent,
    InitshutdownFormComponent,
    SnapshotListComponent,
    SnapshotFormComponent,
    RsyncListComponent,
    RsyncFormComponent,
    SmartListComponent,
    SmartFormComponent,
    ReplicationListComponent,
    ReplicationFormComponent,
    ScrubListComponent,
    ScrubFormComponent
  ],
  providers: [ ReplicationService ]
})
export class TaskCalendarModule {}
