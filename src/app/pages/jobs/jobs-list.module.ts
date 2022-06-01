import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { routing } from 'app/pages/jobs/jobs-list.routing';
import { JobLogsSidebarComponent } from './components/job-logs-sidebar/job-logs-sidebar.component';
import { JobsListComponent } from './jobs-list/jobs-list.component';

@NgModule({
  imports: [
    CoreComponents,
    EntityModule,
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCardModule,
    FormsModule,
    IxTableModule,
    TranslateModule,
    ReactiveFormsModule,
    routing,
    FlexLayoutModule,
    CommonDirectivesModule,
    AppCommonModule,
  ],
  declarations: [JobsListComponent, JobLogsSidebarComponent],
})
export class JobsListModule { }
